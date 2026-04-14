<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanApplicationDependent extends Model
{
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
