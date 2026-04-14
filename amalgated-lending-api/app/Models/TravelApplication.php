<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Isolated travel assistance loan application (not merged with general loan_applications).
 */
class TravelApplication extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'user_id',
        'status',
        'travel_specific_fields',
        'documents',
        'terms_accepted',
        'terms_accepted_at',
        'signatures',
        'applicant_signature',
        'spouse_signature',
    ];

    protected $casts = [
        'travel_specific_fields' => 'array',
        'documents' => 'array',
        'terms_accepted' => 'boolean',
        'terms_accepted_at' => 'datetime',
        'signatures' => 'array',
    ];

    public function borrower(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
