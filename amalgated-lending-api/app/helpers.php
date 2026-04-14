<?php

use App\Models\SystemSetting;

if (! function_exists('setting')) {
    function setting(string $key): array
    {
        return optional(SystemSetting::where('key', $key)->first())->value ?? [];
    }
}
