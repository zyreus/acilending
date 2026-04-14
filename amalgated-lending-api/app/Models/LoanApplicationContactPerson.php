<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanApplicationContactPerson extends Model
{
    protected $table = 'loan_application_contact_persons';

    protected $fillable = [
        'loan_application_id',
        'name',
        'birthdate',
        'school_or_work',
    ];

    protected $casts = [
        'birthdate' => 'date',
    ];

    public function loanApplication(): BelongsTo
    {
        return $this->belongsTo(LoanApplication::class);
    }
}
