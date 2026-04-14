<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_loan_applications', function (Blueprint $table) {
            $table->json('application_form')->nullable()->after('is_signed');
            $table->unsignedTinyInteger('wizard_highest_passed_step')->default(0)->after('application_form');
            $table->string('valid_id_path', 500)->nullable()->after('wizard_highest_passed_step');
            $table->string('proof_income_path', 500)->nullable()->after('valid_id_path');
            $table->json('additional_document_paths')->nullable()->after('proof_income_path');
        });
    }

    public function down(): void
    {
        Schema::table('document_loan_applications', function (Blueprint $table) {
            $table->dropColumn([
                'application_form',
                'wizard_highest_passed_step',
                'valid_id_path',
                'proof_income_path',
                'additional_document_paths',
            ]);
        });
    }
};
