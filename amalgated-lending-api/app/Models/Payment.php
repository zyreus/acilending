<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_PAID = 'paid';
    public const STATUS_PARTIAL = 'partial';
    public const STATUS_OVERDUE = 'overdue';
    public const STATUS_WAIVED = 'waived';

    protected $fillable = [
        'loan_id',
        'installment_no',
        'due_date',
        'amount_due',
        'principal_portion',
        'interest_portion',
        'amount_paid',
        'penalty_amount',
        'paid_at',
        'submitted_at',
        'status',
        'source',
        'payment_method',
        'receipt_path',
        'receipt_name',
        'external_ref',
        'reference_number',
        'notes',
    ];

    protected $casts = [
        'due_date' => 'date',
        'amount_due' => 'decimal:2',
        'principal_portion' => 'decimal:2',
        'interest_portion' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'penalty_amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }
}
