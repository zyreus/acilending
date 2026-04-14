<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LeadContactMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $subjectLine,
        public string $leadName,
        public string $bodyText,
        public string $senderName,
    ) {}

    public function build()
    {
        return $this->subject($this->subjectLine)
            ->view('mail.lead-contact');
    }
}
