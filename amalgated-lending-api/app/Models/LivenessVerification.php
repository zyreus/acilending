<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LivenessVerification extends Model
{
    public const STATUS_VERIFIED = 'verified';

    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'borrower_id',
        'face_id',
        'confidence',
        'images',
        'final_image',
        'similarity_score',
        'status',
        'failure_reason',
    ];

    protected $casts = [
        'images' => 'array',
        'similarity_score' => 'decimal:2',
        'confidence' => 'decimal:6',
    ];

    public function borrower(): BelongsTo
    {
        return $this->belongsTo(User::class, 'borrower_id');
    }
}
