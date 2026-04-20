<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PaymentReceiptMail;
use App\Models\Loan;
use App\Models\Payment;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\BrevoMailService;
use App\Services\CreditScoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class PaymentController extends Controller
{
    /** @var BrevoMailService */
    protected $brevo;

    public function __construct(BrevoMailService $brevo)
    {
        $this->brevo = $brevo;
    }

    public function index(Request $request): JsonResponse
    {
        $q = Payment::query()->with('loan.borrower');

        if ($request->filled('loan_id')) {
            $q->where('loan_id', $request->query('loan_id'));
        }
        if ($request->filled('loan_search')) {
            $loanId = $this->parseLoanSearchToId((string) $request->query('loan_search'));
            if ($loanId !== null) {
                $q->where('loan_id', $loanId);
            }
        }
        if ($request->filled('status')) {
            $q->where('status', $request->query('status'));
        }
        if ($request->filled('overdue')) {
            $q->where('status', '!=', Payment::STATUS_PAID)
                ->whereDate('due_date', '<', now()->toDateString());
        }

        $rows = $q->orderByDesc('due_date')->paginate((int) $request->query('per_page', 20));

        return response()->json(['ok' => true, 'data' => $rows]);
    }

    public function forUser(Request $request, User $user): JsonResponse
    {
        $loanIds = Loan::where('borrower_id', $user->id)->pluck('id');
        $payments = Payment::whereIn('loan_id', $loanIds)
            ->with('loan')
            ->orderByDesc('due_date')
            ->paginate((int) $request->query('per_page', 15));

        return response()->json(['ok' => true, 'data' => $payments]);
    }

    public function record(Request $request, Payment $payment, ActivityLogger $logger, CreditScoreService $creditScore): JsonResponse
    {
        $data = $request->validate([
            'amount_paid' => 'required|numeric|min:0',
            'paid_at' => 'nullable|date',
            'source' => 'nullable|string|in:manual,api',
            'external_ref' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $previousStatus = $payment->status;

        $payment->amount_paid = $data['amount_paid'];
        $payment->paid_at = isset($data['paid_at']) ? \Carbon\Carbon::parse($data['paid_at']) : now();
        $payment->source = $data['source'] ?? 'manual';
        if (isset($data['external_ref'])) {
            $payment->external_ref = $data['external_ref'];
        }
        if (isset($data['notes'])) {
            $payment->notes = $data['notes'];
        }

        if ($payment->amount_paid >= $payment->amount_due - 0.01) {
            $payment->status = Payment::STATUS_PAID;
        } elseif ($payment->amount_paid > 0) {
            $payment->status = Payment::STATUS_PARTIAL;
        }

        if ($payment->status !== Payment::STATUS_PAID && $payment->due_date->isPast()) {
            $payment->status = Payment::STATUS_OVERDUE;
        }

        $payment->save();

        $this->refreshLoanBalance($payment->loan_id);

        $loan = $payment->loan()->with('borrower')->first();
        if ($loan?->borrower) {
            $creditScore->recalculateForUser($loan->borrower);
        }

        $logger->log($request->user(), 'payments.record', $payment);

        $receiptEmail = ['sent' => false, 'note' => null];
        if ($this->paymentJustBecamePaid($previousStatus, $payment->status)) {
            $receiptEmail = $this->sendPaymentReceiptToBorrower($payment);
        }

        return response()->json([
            'ok' => true,
            'payment' => $payment->fresh(['loan']),
            'receipt_email_sent' => $receiptEmail['sent'],
            'receipt_email_note' => $receiptEmail['note'],
        ]);
    }

    public function updateStatus(Request $request, Payment $payment, ActivityLogger $logger, CreditScoreService $creditScore): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|string|in:pending,paid',
        ]);

        $previousStatus = $payment->status;

        if ($data['status'] === Payment::STATUS_PAID) {
            $payment->status = Payment::STATUS_PAID;
            $payment->amount_paid = $payment->amount_due;
            $payment->paid_at = now();
            $payment->source = $payment->source ?: 'manual';
        } else {
            $payment->status = Payment::STATUS_PENDING;
            $payment->amount_paid = 0;
            $payment->paid_at = null;
        }

        $payment->save();
        $this->refreshLoanBalance($payment->loan_id);

        $loan = $payment->loan()->with('borrower')->first();
        if ($loan?->borrower) {
            $creditScore->recalculateForUser($loan->borrower);
        }

        $logger->log($request->user(), 'payments.status_update', $payment, ['status' => $payment->status]);

        $receiptEmail = ['sent' => false, 'note' => null];
        if ($data['status'] === Payment::STATUS_PAID && $this->paymentJustBecamePaid($previousStatus, $payment->status)) {
            $receiptEmail = $this->sendPaymentReceiptToBorrower($payment);
        }

        return response()->json([
            'ok' => true,
            'payment' => $payment->fresh(['loan']),
            'receipt_email_sent' => $receiptEmail['sent'],
            'receipt_email_note' => $receiptEmail['note'],
        ]);
    }

    /**
     * @return array{sent: bool, note: string|null}
     */
    private function sendPaymentReceiptToBorrower(Payment $payment): array
    {
        $email = $this->resolveBorrowerReceiptEmail($payment);
        if (! $email) {
            Log::warning('Payment receipt skipped: no valid borrower email', ['payment_id' => $payment->id]);

            return ['sent' => false, 'note' => 'no_borrower_email'];
        }

        try {
            $payment = $payment->fresh(['loan.borrower']);
            $mailable = new PaymentReceiptMail($payment);
            $borrowerName = $payment->loan?->borrower?->name ?: $email;
            $invoiceNumber = 'INV-'.str_pad((string) $payment->id, 6, '0', STR_PAD_LEFT);
            $subject = "Payment confirmed — {$invoiceNumber} — Amalgated Lending";

            // 1) Brevo REST API when API key is set.
            // 2) Brevo SMTP relay (often works when API HTTPS fails on Windows without CA bundle).
            // 3) Default Laravel mailer (MAIL_MAILER / MAIL_HOST).
            if ($this->brevo->isConfigured()) {
                try {
                    $this->brevo->sendHtml($email, $borrowerName, $subject, $mailable->render());

                    return ['sent' => true, 'note' => null];
                } catch (\Throwable $brevoError) {
                    Log::warning('Brevo API receipt send failed.', [
                        'payment_id' => $payment->id,
                        'borrower_email' => $email,
                        'error' => $brevoError->getMessage(),
                    ]);
                }
            }

            if ($this->brevoSmtpMailerConfigured()) {
                try {
                    Mail::mailer('brevo')->to($email)->send($mailable);

                    return ['sent' => true, 'note' => null];
                } catch (\Throwable $smtpError) {
                    Log::warning('Brevo SMTP mailer receipt send failed.', [
                        'payment_id' => $payment->id,
                        'borrower_email' => $email,
                        'error' => $smtpError->getMessage(),
                    ]);
                }
            }

            Mail::to($email)->send($mailable);

            return ['sent' => true, 'note' => null];
        } catch (\Throwable $e) {
            Log::warning('Payment receipt email failed: '.$e->getMessage(), [
                'payment_id' => $payment->id,
                'borrower_email' => $email,
            ]);
            try {
                // Last-resort fallback: write the receipt email payload to logs so local/dev flows
                // can proceed even when neither Brevo nor SMTP transport is available.
                Mail::mailer('log')->to($email)->send($mailable ?? new PaymentReceiptMail($payment->fresh(['loan.borrower'])));
                Log::info('Payment receipt written to log mailer fallback.', [
                    'payment_id' => $payment->id,
                    'borrower_email' => $email,
                ]);

                return ['sent' => false, 'note' => 'mail_logged_only'];
            } catch (\Throwable $logFallbackError) {
                Log::warning('Payment receipt log-mail fallback failed: '.$logFallbackError->getMessage(), [
                    'payment_id' => $payment->id,
                    'borrower_email' => $email,
                ]);

                return ['sent' => false, 'note' => 'mail_transport_failed'];
            }
        }
    }

    private function brevoSmtpMailerConfigured(): bool
    {
        $user = config('mail.mailers.brevo.username');
        $pass = config('mail.mailers.brevo.password');

        return is_string($user) && $user !== '' && is_string($pass) && $pass !== '';
    }

    private function resolveBorrowerReceiptEmail(Payment $payment): ?string
    {
        $payment->loadMissing('loan.borrower');
        $borrower = $payment->loan?->borrower;
        $email = $borrower?->email;
        if (is_string($email) && filter_var(trim($email), FILTER_VALIDATE_EMAIL)) {
            return trim($email);
        }

        $payload = $payment->loan?->application_payload;
        if (! is_array($payload)) {
            return null;
        }
        foreach (['email', 'contact_email', 'borrower_email'] as $key) {
            $e = $payload[$key] ?? null;
            if (is_string($e) && filter_var(trim($e), FILTER_VALIDATE_EMAIL)) {
                return trim($e);
            }
        }

        return null;
    }

    private function paymentJustBecamePaid(string $previousStatus, string $currentStatus): bool
    {
        $prev = strtolower(trim($previousStatus));
        $cur = strtolower(trim($currentStatus));

        return $cur === Payment::STATUS_PAID && $prev !== Payment::STATUS_PAID;
    }

    /**
     * Resolve admin “loan number” filter: numeric id, #id, or LN-000123.
     */
    private function parseLoanSearchToId(string $raw): ?int
    {
        $t = strtolower(trim($raw));
        if ($t === '') {
            return null;
        }
        if (preg_match('/^ln-0*(\d+)$/', $t, $m)) {
            return (int) $m[1];
        }
        if (preg_match('/^#?(\d+)$/', $t, $m)) {
            return (int) $m[1];
        }

        return null;
    }

    private function refreshLoanBalance(int $loanId): void
    {
        $loan = Loan::find($loanId);
        if (! $loan) {
            return;
        }
        $remaining = Payment::where('loan_id', $loanId)
            ->get()
            ->sum(fn ($p) => max(0, (float) $p->amount_due - (float) $p->amount_paid));
        $loan->outstanding_balance = round(max(0, $remaining), 2);

        $unpaid = Payment::where('loan_id', $loan->id)->where('status', '!=', Payment::STATUS_PAID)->count();
        if ($unpaid === 0 && $loan->status === Loan::STATUS_ONGOING) {
            $loan->status = Loan::STATUS_COMPLETED;
            $loan->completed_at = now();
        }
        $loan->save();

        if ($loan->status === Loan::STATUS_COMPLETED && $loan->borrower_id) {
            $this->archiveBorrowerWhenNoActiveLoans((int) $loan->borrower_id);
        }
    }

    private function archiveBorrowerWhenNoActiveLoans(int $borrowerId): void
    {
        $borrower = User::find($borrowerId);
        if (! $borrower || ! $borrower->is_active) {
            return;
        }

        $hasActiveLoans = Loan::where('borrower_id', $borrowerId)
            ->whereIn('status', [Loan::STATUS_PENDING, Loan::STATUS_APPROVED, Loan::STATUS_ONGOING])
            ->exists();

        if ($hasActiveLoans) {
            return;
        }

        $borrower->is_active = false;
        $borrower->save();
    }
}
