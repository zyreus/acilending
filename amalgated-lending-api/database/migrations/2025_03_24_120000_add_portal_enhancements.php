<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('credit_score', 8, 2)->nullable()->after('phone');
            $table->string('risk_level', 16)->nullable()->index()->after('credit_score');
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->foreignId('assigned_officer_id')->nullable()->after('borrower_id')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assigned_officer_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['credit_score', 'risk_level']);
        });
    }
};
