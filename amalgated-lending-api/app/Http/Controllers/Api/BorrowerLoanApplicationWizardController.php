<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\GeneralLoanApplicationStatusMail;
use App\Models\LoanApplication;
use App\Services\BrevoMailService;
use App\Services\LoanApplicationWorkflowValidator;
use App\Services\SignatureStorageService;
use App\Support\SignedPrintUrls;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * General loan workflow (borrower): draft → documents → signatures → submit (not for travel).
 */
class BorrowerLoanApplicationWizardController extends Controller
{
    public function __construct(
        private LoanApplicationWorkflowValidator $validator,
        private SignatureStorageService $signatures,
        private BrevoMailService $brevo,
    ) {
    }

    public function schema(): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'data' => [
                'loan_types' => config('amalgated_loans.general_loan_types'),
                'wizard_common' => config('amalgated_loans.wizard_common'),
                'loan_type_fields' => config('amalgated_loans.general_form_fields'),
                'documents_by_type' => config('amalgated_loans.general_documents'),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $rows = LoanApplication::query()
            ->where('user_id', $user->id)
            ->whereIn('loan_type', array_keys(config('amalgated_loans.general_loan_types')))
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(fn (LoanApplication $a) => $this->serializeApplication($a));

        return response()->json(['ok' => true, 'data' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'loan_type' => 'required|string|in:'.implode(',', array_keys(config('amalgated_loans.general_loan_types'))),
        ]);

        $app = LoanApplication::create([
            'user_id' => $user->id,
            'loan_type' => $data['loan_type'],
            'status' => LoanApplication::STATUS_DRAFT,
            'form_data' => [],
            'documents' => [],
            'draft_step' => 1,
            'submitted_at' => null,
        ]);

        return response()->json([
            'ok' => true,
            'data' => $this->serializeApplication($app->fresh()),
        ], 201);
    }

    public function show(Request $request, LoanApplication $loanApplication): JsonResponse
    {
        $this->authorizeBorrower($request, $loanApplication);
        $this->ensureGeneralLoanApplication($loanApplication);

        return response()->json([
            'ok' => true,
            'data' => $this->serializeApplication($loanApplication),
        ]);
    }

    public function update(Request $request, LoanApplication $loanApplication): JsonResponse
    {
        $this->authorizeBorrower($request, $loanApplication);
        $this->ensureGeneralLoanApplication($loanApplication);
        if ($this->isLockedForBorrower($loanApplication)) {
            return response()->json(['ok' => false, 'message' => 'This application cannot be edited.'], 422);
        }

        $data = $request->validate([
            'form_data' => 'nullable|array',
            'loan_type' => 'sometimes|string|in:'.implode(',', array_keys(config('amalgated_loans.general_loan_types'))),
            'draft_step' => 'sometimes|integer|min:1|max:5',
        ]);

        if (isset($data['loan_type'])) {
            $loanApplication->loan_type = $data['loan_type'];
        }
        if (array_key_exists('form_data', $data)) {
            $loanApplication->form_data = array_merge($loanApplication->form_data ?? [], $data['form_data'] ?? []);
        }
        if (isset($data['draft_step'])) {
            $loanApplication->draft_step = (int) $data['draft_step'];
        }
        $loanApplication->save();

        return response()->json([
            'ok' => true,
            'data' => $this->serializeApplication($loanApplication->fresh()),
        ]);
    }

    public function uploadDocument(Request $request, LoanApplication $loanApplication, string $docKey): JsonResponse
    {
        $this->authorizeBorrower($request, $loanApplication);
        $this->ensureGeneralLoanApplication($loanApplication);
        if ($this->isLockedForBorrower($loanApplication)) {
            return response()->json(['ok' => false, 'message' => 'Documents are locked for this application.'], 422);
        }

        $loanType = $loanApplication->loan_type;
        $defs = config('amalgated_loans.general_documents.'.$loanType, []);
        if (! isset($defs[$docKey])) {
            return response()->json(['ok' => false, 'message' => 'Invalid document key for this loan type.'], 422);
        }

        $request->validate([
            'file' => 'required|file|max:15360|mimes:jpg,jpeg,png,pdf',
        ]);

        $meta = $defs[$docKey];
        $multiple = (bool) ($meta['multiple'] ?? false);
        $file = $request->file('file');
        $dir = 'documents/'.$loanApplication->id.'/'.$docKey;
        $safe = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'upload';
        $ext = $file->getClientOriginalExtension() ?: 'bin';
        $path = $file->storeAs($dir, $safe.'-'.Str::random(6).'.'.$ext, 'public');

        $documents = $loanApplication->documents ?? [];
        if ($multiple) {
            $documents[$docKey] = array_values(array_merge((array) ($documents[$docKey] ?? []), [$path]));
        } else {
            $documents[$docKey] = $path;
        }
        $loanApplication->documents = $documents;
        $loanApplication->save();

        return response()->json([
            'ok' => true,
            'data' => $this->serializeApplication($loanApplication->fresh()),
        ]);
    }

    public function removeDocument(Request $request, LoanApplication $loanApplication, string $docKey): JsonResponse
    {
        $this->authorizeBorrower($request, $loanApplication);
        $this->ensureGeneralLoanApplication($loanApplication);
        if ($this->isLockedForBorrower($loanApplication)) {
            return response()->json(['ok' => false, 'message' => 'Documents are locked.'], 422);
        }

        $request->validate([
            'path' => 'nullable|string',
        ]);
        $documents = $loanApplication->documents ?? [];
        $path = $request->input('path');

        if (! isset($documents[$docKey])) {
            return response()->json(['ok' => true, 'data' => $this->serializeApplication($loanApplication)]);
        }

        $defs = config('amalgated_loans.general_documents.'.$loanApplication->loan_type, []);
        $multiple = (bool) ($defs[$docKey]['multiple'] ?? false);

        if ($multiple && is_array($documents[$docKey])) {
            $list = array_values(array_filter($documents[$docKey], fn ($p) => $p !== $path));
            $documents[$docKey] = $list;
        } else {
            if ($documents[$docKey] === $path || $path === null) {
                unset($documents[$docKey]);
            }
        }

        if ($path && $path !== '') {
            Storage::disk('public')->delete($path);
        }

        $loanApplication->documents = $documents;
        $loanApplication->save();

        return response()->json([
            'ok' => true,
            'data' => $this->serializeApplication($loanApplication->fresh()),
        ]);
    }

    public function validateStep(Request $request, LoanApplication $loanApplication): JsonResponse
    {
        $this->authorizeBorrower($request, $loanApplication);
        $this->ensureGeneralLoanApplication($loanApplication);
        $data = $request->validate([
            'step' => 'required|integer|min:1|max:4',
        ]);
        $step = (int) $data['step'];
        $errors = match ($step) {
            1 => $this->validator->validateForm($loanApplication),
            2 => $this->validator->validateDocumentsComplete($loanApplication),
            3 => array_merge(
                $this->validator->validateBeforeSignatureStep($loanApplication),
                $this->validator->validateSignatures($loanApplication)
            ),
            4 => $this->validator->validateSubmit($loanApplication),
            default => [],
        };

        return response()->json([
            'ok' => count($errors) === 0,
            'errors' => $errors,
        ]);
    }

    public function saveSignature(Request $request, LoanApplication $loanApplication): JsonResponse
    {
        $this->authorizeBorrower($request, $loanApplication);
        $this->ensureGeneralLoanApplication($loanApplication);
        if ($this->isLockedForBorrower($loanApplication)) {
            return response()->json(['ok' => false, 'message' => 'Application is locked.'], 422);
        }

        $errs = $this->validator->validateBeforeSignatureStep($loanApplication);
        if ($errs !== []) {
            return response()->json(['ok' => false, 'message' => 'Complete documents before signature.', 'errors' => $errs], 422);
        }

        $data = $request->validate([
            'role' => 'required|string|in:applicant,spouse,comaker',
            'signature_base64' => 'required|string',
        ]);

        $path = $this->signatures->storeBase64Png($data['signature_base64'], 'signatures');

        match ($data['role']) {
            'applicant' => $loanApplication->applicant_signature = $path,
            'spouse' => $loanApplication->spouse_signature = $path,
            'comaker' => $loanApplication->comaker_signature = $path,
            default => null,
        };
        $loanApplication->save();

        return response()->json([
            'ok' => true,
            'data' => $this->serializeApplication($loanApplication->fresh()),
        ]);
    }

    public function submit(Request $request, LoanApplication $loanApplication): JsonResponse
    {
        $this->authorizeBorrower($request, $loanApplication);
        $this->ensureGeneralLoanApplication($loanApplication);
        if ($loanApplication->submitted_at !== null && $loanApplication->status !== LoanApplication::STATUS_REJECTED) {
            return response()->json(['ok' => false, 'message' => 'Already submitted.'], 422);
        }

        $errors = $this->validator->validateSubmit($loanApplication);
        if ($errors !== []) {
            return response()->json(['ok' => false, 'errors' => $errors], 422);
        }

        $loanApplication->status = LoanApplication::STATUS_PENDING;
        $loanApplication->rejection_reason = null;
        $loanApplication->submitted_at = now();
        $loanApplication->draft_step = 5;
        $loanApplication->save();
        $this->notifyBorrowerApplicationStatus($loanApplication->fresh(['borrower']), LoanApplication::STATUS_PENDING);

        return response()->json([
            'ok' => true,
            'data' => $this->serializeApplication($loanApplication->fresh()),
            'message' => 'Application submitted. Our team will review it shortly.',
        ]);
    }

    private function ensureGeneralLoanApplication(LoanApplication $loanApplication): void
    {
        if (! in_array($loanApplication->loan_type, array_keys(config('amalgated_loans.general_loan_types')), true)) {
            abort(404);
        }
    }

    private function isLockedForBorrower(LoanApplication $loanApplication): bool
    {
        if ($loanApplication->submitted_at === null) {
            return false;
        }

        return $loanApplication->status !== LoanApplication::STATUS_REJECTED;
    }

    private function authorizeBorrower(Request $request, LoanApplication $loanApplication): void
    {
        $user = $request->user();
        if (! $user || (int) $loanApplication->user_id !== (int) $user->id) {
            abort(403);
        }
    }

    private function notifyBorrowerApplicationStatus(LoanApplication $loanApplication, string $status): void
    {
        $borrower = $loanApplication->borrower;
        if (! $borrower) {
            return;
        }

        $email = trim((string) $borrower->email);
        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        $mailable = new GeneralLoanApplicationStatusMail($loanApplication, (string) $borrower->name, $status);
        $subject = match ($status) {
            LoanApplication::STATUS_APPROVED => 'Loan application update: approved — Amalgated Lending Inc.',
            LoanApplication::STATUS_REJECTED => 'Loan application update: rejected — Amalgated Lending Inc.',
            default => 'Loan application submitted — Amalgated Lending Inc.',
        };

        if ($this->brevo->isConfigured()) {
            try {
                $this->brevo->sendHtml($email, (string) $borrower->name, $subject, $mailable->render());

                return;
            } catch (\Throwable $e) {
                report($e);
            }
        }

        try {
            Mail::to($email)->send($mailable);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    private function serializeApplication(LoanApplication $a): array
    {
        $docs = [];
        foreach ($a->documents ?? [] as $key => $paths) {
            $urls = [];
            if (is_array($paths)) {
                foreach ($paths as $p) {
                    if ($p) {
                        $urls[] = Storage::disk('public')->url($p);
                    }
                }
            } elseif ($paths) {
                $urls[] = Storage::disk('public')->url($paths);
            }
            $docs[$key] = ['paths' => is_array($paths) ? $paths : ($paths ? [$paths] : []), 'urls' => $urls];
        }

        $label = config('amalgated_loans.general_loan_types')[$a->loan_type] ?? $a->loan_type;

        return [
            'id' => $a->id,
            'loan_type' => $a->loan_type,
            'loan_type_label' => $label,
            'status' => $a->status,
            'form_data' => $a->form_data ?? [],
            'documents' => $docs,
            'draft_step' => $a->draft_step,
            'submitted_at' => $a->submitted_at?->toIso8601String(),
            'verified_at' => $a->verified_at?->toIso8601String(),
            'rejection_reason' => $a->rejection_reason,
            'signatures' => [
                'applicant' => $a->applicant_signature ? Storage::disk('public')->url($a->applicant_signature) : null,
                'spouse' => $a->spouse_signature ? Storage::disk('public')->url($a->spouse_signature) : null,
                'comaker' => $a->comaker_signature ? Storage::disk('public')->url($a->comaker_signature) : null,
            ],
            'applicant_signature_path' => $a->applicant_signature,
            'spouse_signature_path' => $a->spouse_signature,
            'comaker_signature_path' => $a->comaker_signature,
            'is_draft' => $a->submitted_at === null,
            'print_url' => SignedPrintUrls::temporaryRoute(
                'print.general-loan',
                now()->addMinutes(45),
                ['loanApplication' => $a->id]
            ),
        ];
    }
}
