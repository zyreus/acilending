<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UploadedDocument extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_VERIFIED = 'verified';

    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'document_loan_application_id',
        'loan_requirement_id',
        'file_path',
        'original_name',
        'status',
        'remarks',
        'version',
    ];

    protected $casts = [
        'version' => 'integer',
    ];

    public function documentLoanApplication(): BelongsTo
    {
        return $this->belongsTo(DocumentLoanApplication::class);
    }

    public function loanRequirement(): BelongsTo
    {
        return $this->belongsTo(LoanRequirement::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(DocumentUploadHistory::class);
    }
}
