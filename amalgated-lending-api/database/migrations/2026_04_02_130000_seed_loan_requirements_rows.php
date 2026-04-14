<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private function reqs(string $slug, array $names): void
    {
        $id = DB::table('loan_products')->where('slug', $slug)->value('id');
        if (! $id) {
            return;
        }
        if (DB::table('loan_requirements')->where('loan_product_id', $id)->exists()) {
            return;
        }
        $sort = 0;
        foreach ($names as $name) {
            DB::table('loan_requirements')->insert([
                'loan_product_id' => $id,
                'requirement_name' => $name,
                'sort_order' => $sort++,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function up(): void
    {
        $this->reqs('travel-assistance-loan', [
            'Signed application form',
            'Two (2) valid government-issued IDs',
            'Passport / travel document (copy)',
            'TIN ID or TIN document',
            'Proof of billing (recent)',
            'Bank statements — latest 4 consecutive months',
            '2×2 ID photo',
        ]);

        $this->reqs('sss-pension-loan', [
            'Signed application form',
            'Two (2) valid government-issued IDs',
            'SSS / GSIS pension verification document',
            'Proof of billing (recent)',
            'Bank statements — latest 4 consecutive months',
            '2×2 ID photo',
            'Birth certificate / PSA (if applicable)',
        ]);

        $this->reqs('chattel-mortgage', [
            'Signed application form',
            'Two (2) valid government-issued IDs',
            'Certificate of Registration (OR/CR) or collateral documents',
            'TIN ID or TIN document',
            'Proof of income / employment certificate',
            'Proof of billing (recent)',
        ]);

        $this->reqs('real-estate-mortgage', [
            'Signed application form',
            'Two (2) valid government-issued IDs',
            'Property title / collateral documents',
            'Tax declaration / lot plan (if applicable)',
            'TIN ID or TIN document',
            'Proof of income',
            'Proof of billing (recent)',
        ]);

        $this->reqs('salary-loan', [
            'Signed application form',
            'Two (2) valid government-issued IDs',
            'Certificate of employment & latest payslip',
            'TIN ID or TIN document',
            'Proof of billing (recent)',
            'Bank statements — latest 3 months (if required)',
        ]);
    }

    public function down(): void
    {
        $ids = DB::table('loan_products')->whereIn('slug', [
            'travel-assistance-loan',
            'sss-pension-loan',
            'chattel-mortgage',
            'real-estate-mortgage',
            'salary-loan',
        ])->pluck('id');
        if ($ids->isEmpty()) {
            return;
        }
        DB::table('loan_requirements')->whereIn('loan_product_id', $ids)->delete();
    }
};
