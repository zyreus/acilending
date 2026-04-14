<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('loan_products')->where('slug', 'sss-pension-loan')->exists()) {
            return;
        }

        DB::table('loan_products')->insert([
            'slug' => 'sss-pension-loan',
            'name' => 'SSS Pension Loan',
            'description' => 'Loan for SSS/GSIS pensioners.',
            'interest_rate' => 2.24,
            'rate_type' => 'monthly',
            'collateral' => 'ATM card',
            'requirements' => 'Loan application, 2 valid IDs, PSA birth certificate, marriage certificate if applicable, 2×2 photo, proof of billing, 4 months bank statements, pension verification (ID or award/statement). Co-maker optional. Standard rate 2.24%/mo.',
            'max_term' => 36,
            'age_limit' => 70,
            'safe_age' => 65,
            'sample_monthly_pension' => 4000,
            'calculator_config' => json_encode([
                'pension_multiplier' => 18.75,
                'max_principal' => 1000000,
                'computation_style' => 'straight_line',
                'fee_profile' => 'pension',
                'service_charge_new_loan' => 2750,
                'insurance_per_1000' => 35,
                'notarial_new_loan' => 350,
            ]),
            'status' => 'active',
            'tier' => 'green',
            'icon_key' => 'shield',
            'sort_order' => 10,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('loan_products')->where('slug', 'sss-pension-loan')->delete();
    }
};
