<?php

namespace App\Mail;

use App\Models\LoanApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class GeneralLoanApplicationStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public LoanApplication $application,
        public string $borrowerName,
        public string $status,
    ) {}

    public function build()
    {
        $subject = match ($this->status) {
            LoanApplication::STATUS_APPROVED => 'Loan application update: approved — Amalgated Lending Inc.',
            LoanApplication::STATUS_REJECTED => 'Loan application update: rejected — Amalgated Lending Inc.',
            default => 'Loan application submitted — Amalgated Lending Inc.',
        };

        return $this->subject($subject)
            ->view('mail.general-loan-application-status', [
                'borrowerName' => $this->borrowerName,
                'applicationId' => $this->application->id,
                'loanType' => $this->application->loan_type,
                'status' => $this->status,
                'rejectionReason' => (string) ($this->application->rejection_reason ?? ''),
                'submittedAt' => optional($this->application->submitted_at)?->format('M d, Y h:i A'),
            ]);
    }
}

