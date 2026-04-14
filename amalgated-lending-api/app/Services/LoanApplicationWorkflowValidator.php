<?php

namespace App\Services;

use App\Models\LoanApplication;
use App\Support\LoanApplicationDocumentStatus;

class LoanApplicationWorkflowValidator
{
    /**
     * @return array<int, string> Error messages (empty if valid)
     */
    public function validateForm(LoanApplication $app): array
    {
        $errors = [];
        $loanType = $app->loan_type;
        if (! $loanType) {
            return ['Select a loan type.'];
        }

        $data = $app->form_data ?? [];

        foreach (config('amalgated_loans.wizard_common', []) as $row) {
            if (! $this->fieldRequiredForLoanType($row, $loanType)) {
                continue;
            }
            $key = $row['key'];
            $val = $data[$key] ?? null;
            if ($val === null || $val === '') {
                $errors[] = ($row['label'] ?? $key).' is required.';
            }
        }

        foreach (config('amalgated_loans.general_form_fields.'.$loanType, []) as $row) {
            if (! ($row['required'] ?? false)) {
                continue;
            }
            $key = $row['key'];
            $val = $data[$key] ?? null;
            if ($val === null || $val === '') {
                $errors[] = ($row['label'] ?? $key).' is required.';
            }
        }

        return $errors;
    }

    /**
     * @param  array{required_for_loan_types?: ?array, key: string}  $row
     */
    private function fieldRequiredForLoanType(array $row, string $loanType): bool
    {
        $cond = $row['required_for_loan_types'] ?? null;
        if ($cond === null) {
            return true;
        }
        if ($cond === []) {
            return false;
        }

        return in_array($loanType, $cond, true);
    }

    /**
     * @return array<int, string>
     */
    public function validateDocumentsComplete(LoanApplication $app): array
    {
        $loanType = $app->loan_type;
        if (! $loanType) {
            return ['Loan type is required before documents.'];
        }

        $status = LoanApplicationDocumentStatus::forGeneralLoanType($loanType, $app->documents ?? []);
        $errors = [];
        foreach ($status as $key => $row) {
            if (! $row['ok']) {
                $errors[] = 'Missing document: '.$row['label'];
            }
        }

        return $errors;
    }

    /**
     * @return array<int, string>
     */
    public function validateSignatures(LoanApplication $app): array
    {
        $errors = [];
        if (! $app->applicant_signature) {
            $errors[] = 'Applicant signature is required.';
        }
        if ($app->loan_type === LoanApplication::TYPE_CHATTEL && ! $app->comaker_signature) {
            $errors[] = 'Co-maker signature is required for Chattel Mortgage.';
        }

        return $errors;
    }

    /**
     * Full validation before submit.
     *
     * @return array<int, string>
     */
    public function validateSubmit(LoanApplication $app): array
    {
        return array_merge(
            $this->validateForm($app),
            $this->validateDocumentsComplete($app),
            $this->validateSignatures($app)
        );
    }

    /**
     * Step gating: cannot open signature step until documents complete + form valid.
     *
     * @return array<int, string>
     */
    public function validateBeforeSignatureStep(LoanApplication $app): array
    {
        return array_merge(
            $this->validateForm($app),
            $this->validateDocumentsComplete($app)
        );
    }
}
