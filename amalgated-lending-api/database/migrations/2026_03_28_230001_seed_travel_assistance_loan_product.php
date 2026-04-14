<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('loan_products')->where('slug', 'travel-assistance-loan')->exists()) {
            return;
        }

        DB::table('loan_products')->insert([
            'slug' => 'travel-assistance-loan',
            'name' => 'Travel Assistance Loan',
            'description' => 'Loan for overseas work/travel.',
            'interest_rate' => 3.5,
            'rate_type' => 'monthly',
            'collateral' => 'Landbank account',
            'requirements' => 'Application form, 2 valid government IDs, OR/CR if applicable, 2×2 photo, TIN ID, bank statements (4 consecutive months), proof of billing. Landbank account. Max loan ₱2,000,000; monthly renewal (1 month). Destination, travel date, and purpose required.',
            'max_term' => 1,
            'calculator_config' => json_encode([
                'max_principal' => 2000000,
                'fixed_term_months' => 1,
                'fee_profile' => 'travel',
            ]),
            'status' => 'active',
            'tier' => 'orange',
            'icon_key' => 'plane',
            'sort_order' => 9,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('loan_products')->where('slug', 'travel-assistance-loan')->delete();
    }
};
