<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('loan_products')->where('slug', 'real-estate-mortgage')->exists()) {
            return;
        }

        DB::table('loan_products')->insert([
            'slug' => 'real-estate-mortgage',
            'name' => 'Real Estate Mortgage Loan',
            'description' => 'Long-term financing secured by real property.',
            'interest_rate' => 3.88,
            'rate_type' => 'monthly',
            'collateral' => 'Title',
            'requirements' => 'Loan application, 2 government IDs, CTC, 2×2 ID, tax declaration & clearance, vicinity map, TIN, bank statement, billing, proof of income. Optional: marriage contract. Clean title preferred; max term 36 months; standard rate 3.88%/mo.',
            'max_term' => 36,
            'calculator_config' => json_encode([
                'computation_style' => 'straight_line',
                'fee_profile' => 'mortgage',
            ]),
            'status' => 'active',
            'tier' => 'blue',
            'icon_key' => 'home',
            'sort_order' => 6,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('loan_products')->where('slug', 'real-estate-mortgage')->delete();
    }
};
