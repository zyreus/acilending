<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CmsContent extends Model
{
    protected $table = 'cms_contents';

    protected $fillable = [
        'section_key',
        'locale',
        'title',
        'body',
        'meta',
        'updated_by',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
