<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            $table->string('employer_name', 255)->nullable()->after('property_value');
            $table->decimal('monthly_salary', 14, 2)->nullable()->after('employer_name');
        });
    }

    public function down(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            $table->dropColumn(['employer_name', 'monthly_salary']);
        });
    }
};
