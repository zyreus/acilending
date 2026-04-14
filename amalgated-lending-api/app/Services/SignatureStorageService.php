<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SignatureStorageService
{
    /**
     * Decode a data-URL or raw base64 PNG payload and store on the public disk.
     *
     * @return string Relative path (e.g. signatures/abc.png)
     */
    public function storeBase64Png(string $dataUrlOrBase64, string $directory = 'signatures'): string
    {
        $raw = preg_replace('#^data:image/\w+;base64,#i', '', $dataUrlOrBase64);
        $binary = base64_decode($raw, true);
        if ($binary === false || $binary === '') {
            throw new \InvalidArgumentException('Invalid base64 signature payload.');
        }

        $path = trim($directory, '/').'/'.Str::uuid()->toString().'.png';
        Storage::disk('public')->put($path, $binary);

        return $path;
    }
}
