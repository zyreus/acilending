<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TravelLoanWizardForm extends Model
{
    protected $fillable = [
        'loan_application_id',
        'wizard_data',
        'terms_accepted',
        'terms_accepted_at',
        'signature_data',
        'signature_date',
    ];

    protected $casts = [
        'wizard_data' => 'array',
        'terms_accepted' => 'boolean',
        'terms_accepted_at' => 'datetime',
        'signature_date' => 'date',
    ];

    public function loanApplication(): BelongsTo
    {
        return $this->belongsTo(LoanApplication::class);
    }
}
