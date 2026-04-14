<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('loan_products')->where('slug', 'salary-loan')->exists()) {
            return;
        }

        DB::table('loan_products')->insert([
            'slug' => 'salary-loan',
            'name' => 'Salary Loan',
            'description' => 'Payroll-based loan for employees.',
            'interest_rate' => 1.5,
            'rate_type' => 'monthly',
            'collateral' => 'Salary deduction',
            'requirements' => 'Loan application form, 2 valid government IDs (borrower and co-maker), latest payslip (borrower and co-maker), proof of billing, barangay certification. Co-maker is required.',
            'max_term' => 60,
            'status' => 'active',
            'tier' => 'green',
            'icon_key' => 'briefcase',
            'sort_order' => 7,
            'calculator_config' => json_encode(['salary_principal_multiplier' => 6]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('loan_products')->where('slug', 'salary-loan')->delete();
    }
};
