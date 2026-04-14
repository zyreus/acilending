<?php

namespace App\Mail;

use App\Models\Loan;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LoanDecisionMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Loan $loan,
        public string $borrowerName,
        public string $decision,
    ) {}

    public function build()
    {
        $isRejected = $this->decision === Loan::STATUS_REJECTED;
        $subject = $isRejected
            ? 'Loan application update: rejected — Amalgated Lending'
            : 'Loan application update: approved — Amalgated Lending';

        return $this->subject($subject)
            ->view('mail.loan-decision', [
                'borrowerName' => $this->borrowerName,
                'loanId' => $this->loan->id,
                'principal' => number_format((float) $this->loan->principal, 2),
                'termMonths' => (int) $this->loan->term_months,
                'decision' => $this->decision,
                'rejectionReason' => (string) ($this->loan->rejection_reason ?? ''),
                'approvedAt' => optional($this->loan->approved_at)?->format('M d, Y h:i A'),
                'monthlyPayment' => (float) ($this->loan->monthly_payment ?? 0),
            ]);
    }
}
