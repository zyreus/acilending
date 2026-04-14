<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminNavigationItem extends Model
{
    protected $fillable = [
        'path',
        'label',
        'icon_key',
        'sort_order',
        'permission_slug',
        'match_end',
    ];

    protected $casts = [
        'match_end' => 'boolean',
    ];
}
