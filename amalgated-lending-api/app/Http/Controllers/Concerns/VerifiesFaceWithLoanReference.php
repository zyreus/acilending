<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Loan;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

trait VerifiesFaceWithLoanReference
{
    /**
     * Reference face: latest loan KYC face photo on the public disk.
     */
    protected function loadReferenceFaceBytes(User $user): ?string
    {
        $loan = Loan::query()
            ->where('borrower_id', $user->id)
            ->whereNotNull('face_photo_path')
            ->orderByDesc('id')
            ->first();

        if (! $loan || ! $loan->face_photo_path) {
            return null;
        }

        $path = Storage::disk('public')->path($loan->face_photo_path);
        if (! is_file($path) || ! is_readable($path)) {
            return null;
        }

        $bytes = file_get_contents($path);

        return is_string($bytes) && $bytes !== '' ? $bytes : null;
    }

    protected function decodeBase64Image(string $raw): ?string
    {
        $s = trim($raw);
        if (str_starts_with($s, 'data:')) {
            $parts = explode(',', $s, 2);
            $s = $parts[1] ?? '';
        }
        $s = str_replace(["\r", "\n", ' '], '', $s);
        $bin = base64_decode($s, true);

        return $bin !== false && $bin !== '' ? $bin : null;
    }

    protected function isAllowedImageBinary(string $bytes): bool
    {
        if (str_starts_with($bytes, "\xFF\xD8\xFF")) {
            return true;
        }
        if (str_starts_with($bytes, "\x89PNG\r\n\x1a\n")) {
            return true;
        }

        return false;
    }

    protected function detectExtension(string $bytes): string
    {
        if (str_starts_with($bytes, "\xFF\xD8\xFF")) {
            return 'jpg';
        }

        return 'png';
    }
}
