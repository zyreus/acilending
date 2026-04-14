<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanReceipt extends Model
{
    protected $fillable = [
        'loan_id',
        'borrower_name',
        'amount',
        'interest',
        'total_payable',
        'meta',
        'updated_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'interest' => 'decimal:2',
        'total_payable' => 'decimal:2',
        'meta' => 'array',
    ];

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
