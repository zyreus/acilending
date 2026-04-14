<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            if (! Schema::hasColumn('loan_applications', 'submitted_at')) {
                $table->timestamp('submitted_at')->nullable()->after('status')->index();
            }
            if (! Schema::hasColumn('loan_applications', 'draft_step')) {
                $table->unsignedTinyInteger('draft_step')->default(1)->after('submitted_at');
            }
            if (! Schema::hasColumn('loan_applications', 'verified_at')) {
                $table->timestamp('verified_at')->nullable()->after('draft_step')->index();
            }
            if (! Schema::hasColumn('loan_applications', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('verified_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            foreach (['rejection_reason', 'verified_at', 'draft_step', 'submitted_at'] as $col) {
                if (Schema::hasColumn('loan_applications', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
