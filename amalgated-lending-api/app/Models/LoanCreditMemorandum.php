<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanCreditMemorandum extends Model
{
    protected $fillable = [
        'loan_application_id',
        'date_application_received',
        'application_status',
        'documents_status',
        'payments_status',
        'recommended_by',
        'approved_rate',
        'approved_amount',
        'approved_by',
        'approved_date',
        'internal_notes',
    ];

    protected $casts = [
        'date_application_received' => 'date',
        'approved_rate' => 'decimal:4',
        'approved_amount' => 'decimal:2',
        'approved_date' => 'date',
    ];

    public function loanApplication(): BelongsTo
    {
        return $this->belongsTo(LoanApplication::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
