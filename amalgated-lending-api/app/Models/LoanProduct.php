<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoanProduct extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'description',
        'interest_rate',
        'rate_type',
        'collateral',
        'requirements',
        'max_term',
        'age_limit',
        'safe_age',
        'downpayment',
        'status',
        'tier',
        'icon_key',
        'sample_monthly_pension',
        'sample_computation_note',
        'calculator_config',
        'sort_order',
    ];

    protected $casts = [
        'interest_rate' => 'decimal:4',
        'max_term' => 'integer',
        'age_limit' => 'integer',
        'safe_age' => 'integer',
        'sample_monthly_pension' => 'decimal:2',
        'calculator_config' => 'array',
        'sort_order' => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function loanRequirements(): HasMany
    {
        return $this->hasMany(LoanRequirement::class)->orderBy('sort_order')->orderBy('id');
    }
}
