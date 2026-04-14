<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $exists = DB::table('loan_products')->where('slug', 'chattel-mortgage')->exists();
        if ($exists) {
            return;
        }

        DB::table('loan_products')->insert([
            'slug' => 'chattel-mortgage',
            'name' => 'Chattel Mortgage Loan',
            'description' => 'Vehicle and movable asset financing.',
            'interest_rate' => 3.88,
            'rate_type' => 'monthly',
            'collateral' => 'OR/CR',
            'requirements' => 'Loan application form, 2 government IDs, OR/CR photocopy, 2×2 ID picture, stencil, co-maker, bank statement, proof of billing, proof of income. Optional: marriage contract, TIN ID/number. Max term 36 months. Standard rate 3.88%/mo.',
            'max_term' => 36,
            'calculator_config' => json_encode([
                'computation_style' => 'straight_line',
                'fee_profile' => 'mortgage',
            ]),
            'status' => 'active',
            'tier' => 'blue',
            'icon_key' => 'vehicle',
            'sort_order' => 5,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('loan_products')->where('slug', 'chattel-mortgage')->delete();
    }
};
