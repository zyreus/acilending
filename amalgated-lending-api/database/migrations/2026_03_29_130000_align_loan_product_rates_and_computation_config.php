<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $patch = function (string $slug, array $columns, array $configMerge): void {
            $row = DB::table('loan_products')->where('slug', $slug)->first();
            if (! $row) {
                return;
            }
            $cfg = [];
            if (! empty($row->calculator_config)) {
                $decoded = json_decode((string) $row->calculator_config, true);
                $cfg = is_array($decoded) ? $decoded : [];
            }
            $cfg = array_merge($cfg, $configMerge);
            $columns['calculator_config'] = json_encode($cfg);
            DB::table('loan_products')->where('slug', $slug)->update($columns);
        };

        $patch('chattel-mortgage', [
            'interest_rate' => 3.88,
            'max_term' => 36,
        ], [
            'computation_style' => 'straight_line',
            'fee_profile' => 'mortgage',
        ]);

        $patch('real-estate-mortgage', [
            'interest_rate' => 3.88,
            'max_term' => 36,
        ], [
            'computation_style' => 'straight_line',
            'fee_profile' => 'mortgage',
        ]);

        $patch('travel-assistance-loan', [], [
            'max_principal' => 2000000,
            'fixed_term_months' => 1,
            'fee_profile' => 'travel',
        ]);

        $patch('sss-pension-loan', [
            'interest_rate' => 2.24,
        ], [
            'pension_multiplier' => 18.75,
            'max_principal' => 1000000,
            'computation_style' => 'straight_line',
            'fee_profile' => 'pension',
            'service_charge_new_loan' => 2750,
            'insurance_per_1000' => 35,
            'notarial_new_loan' => 350,
        ]);
    }

    public function down(): void
    {
        $patch = function (string $slug, array $columns, array $configKeysToRemove): void {
            $row = DB::table('loan_products')->where('slug', $slug)->first();
            if (! $row) {
                return;
            }
            $cfg = [];
            if (! empty($row->calculator_config)) {
                $decoded = json_decode((string) $row->calculator_config, true);
                $cfg = is_array($decoded) ? $decoded : [];
            }
            foreach ($configKeysToRemove as $k) {
                unset($cfg[$k]);
            }
            $columns['calculator_config'] = json_encode($cfg);
            DB::table('loan_products')->where('slug', $slug)->update($columns);
        };

        $patch('chattel-mortgage', [
            'interest_rate' => 3.0,
            'max_term' => 60,
        ], ['computation_style', 'fee_profile']);

        $patch('real-estate-mortgage', [
            'interest_rate' => 3.0,
            'max_term' => 240,
        ], ['computation_style', 'fee_profile']);

        $patch('travel-assistance-loan', [], ['max_principal', 'fixed_term_months', 'fee_profile']);

        $patch('sss-pension-loan', [
            'interest_rate' => 2.45,
        ], [
            'pension_multiplier',
            'max_principal',
            'computation_style',
            'fee_profile',
            'service_charge_new_loan',
            'insurance_per_1000',
            'notarial_new_loan',
        ]);
    }
};
