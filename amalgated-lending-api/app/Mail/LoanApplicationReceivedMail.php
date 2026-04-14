<?php

namespace App\Mail;

use App\Models\Loan;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LoanApplicationReceivedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Loan $loan,
        public string $borrowerName,
    ) {}

    public function build()
    {
        return $this->subject('We received your loan application — Amalgated Lending')
            ->view('mail.loan-application-received', [
                'borrowerName' => $this->borrowerName,
                'loanId' => $this->loan->id,
                'principal' => number_format((float) $this->loan->principal, 2),
                'termMonths' => (int) $this->loan->term_months,
            ]);
    }
}

