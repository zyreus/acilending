<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            $table->string('pension_type', 20)->nullable()->after('purpose');
            $table->decimal('monthly_pension', 14, 2)->nullable()->after('pension_type');
            $table->unsignedTinyInteger('age')->nullable()->after('monthly_pension');
        });
    }

    public function down(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            $table->dropColumn(['pension_type', 'monthly_pension', 'age']);
        });
    }
};
