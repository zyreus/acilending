<?php

namespace App\Support;

/**
 * Checklist helpers for print views and borrower API (uploaded vs missing).
 */
class LoanApplicationDocumentStatus
{
    /**
     * @param  array<string, mixed>|null  $documents  JSON from loan_applications.documents
     * @return array<string, array{label: string, ok: bool, paths: array<int, string>}>
     */
    public static function forGeneralLoanType(?string $loanType, ?array $documents): array
    {
        $loanType = $loanType ?: '';
        $documents = $documents ?? [];
        $defs = config('amalgated_loans.general_documents.'.$loanType, []);
        $out = [];
        foreach ($defs as $key => $meta) {
            $paths = $documents[$key] ?? null;
            $list = [];
            if (is_array($paths)) {
                $list = array_values(array_filter($paths, fn ($p) => is_string($p) && $p !== ''));
            } elseif (is_string($paths) && $paths !== '') {
                $list = [$paths];
            }
            $required = (bool) ($meta['required'] ?? false);
            $ok = ! $required || count($list) > 0;
            $out[$key] = [
                'label' => (string) ($meta['label'] ?? $key),
                'ok' => $ok,
                'paths' => $list,
            ];
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>|null  $documents
     * @return array<string, array{label: string, ok: bool, paths: array<int, string>}>
     */
    public static function forTravel(?array $documents): array
    {
        $documents = $documents ?? [];
        $defs = config('amalgated_loans.travel_documents', []);
        $out = [];
        foreach ($defs as $key => $meta) {
            $paths = $documents[$key] ?? null;
            $list = [];
            if (is_array($paths)) {
                $list = array_values(array_filter($paths, fn ($p) => is_string($p) && $p !== ''));
            } elseif (is_string($paths) && $paths !== '') {
                $list = [$paths];
            }
            $required = (bool) ($meta['required'] ?? false);
            $ok = ! $required || count($list) > 0;
            $out[$key] = [
                'label' => (string) ($meta['label'] ?? $key),
                'ok' => $ok,
                'paths' => $list,
            ];
        }

        return $out;
    }
}
