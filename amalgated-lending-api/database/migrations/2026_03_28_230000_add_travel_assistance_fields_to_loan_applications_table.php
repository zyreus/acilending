<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            $table->string('destination_country', 120)->nullable()->after('monthly_salary');
            $table->date('travel_date')->nullable()->after('destination_country');
            $table->text('purpose')->nullable()->after('travel_date');
        });
    }

    public function down(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            $table->dropColumn(['destination_country', 'travel_date', 'purpose']);
        });
    }
};
