<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            if (! Schema::hasColumn('loan_applications', 'applicant_signature')) {
                $after = Schema::hasColumn('loan_applications', 'documents') ? 'documents' : 'status';
                $table->string('applicant_signature', 512)->nullable()->after($after);
            }
            if (! Schema::hasColumn('loan_applications', 'spouse_signature')) {
                $table->string('spouse_signature', 512)->nullable()->after('applicant_signature');
            }
            if (! Schema::hasColumn('loan_applications', 'comaker_signature')) {
                $table->string('comaker_signature', 512)->nullable()->after('spouse_signature');
            }
        });

        Schema::table('travel_applications', function (Blueprint $table) {
            if (! Schema::hasColumn('travel_applications', 'applicant_signature')) {
                $after = Schema::hasColumn('travel_applications', 'signatures') ? 'signatures' : 'documents';
                $table->string('applicant_signature', 512)->nullable()->after($after);
            }
            if (! Schema::hasColumn('travel_applications', 'spouse_signature')) {
                $table->string('spouse_signature', 512)->nullable()->after('applicant_signature');
            }
        });
    }

    public function down(): void
    {
        Schema::table('travel_applications', function (Blueprint $table) {
            foreach (['spouse_signature', 'applicant_signature'] as $col) {
                if (Schema::hasColumn('travel_applications', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('loan_applications', function (Blueprint $table) {
            foreach (['comaker_signature', 'spouse_signature', 'applicant_signature'] as $col) {
                if (Schema::hasColumn('loan_applications', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
