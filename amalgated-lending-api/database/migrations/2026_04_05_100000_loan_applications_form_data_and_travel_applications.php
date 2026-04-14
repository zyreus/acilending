<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            if (! Schema::hasColumn('loan_applications', 'form_data')) {
                $table->json('form_data')->nullable()->after('status');
            }
            if (! Schema::hasColumn('loan_applications', 'documents')) {
                $table->json('documents')->nullable()->after('form_data');
            }
        });

        Schema::create('travel_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status', 24)->default('pending')->index();
            $table->json('travel_specific_fields')->nullable();
            $table->json('documents')->nullable();
            $table->boolean('terms_accepted')->default(false);
            $table->timestamp('terms_accepted_at')->nullable();
            $table->json('signatures')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('travel_applications');

        Schema::table('loan_applications', function (Blueprint $table) {
            if (Schema::hasColumn('loan_applications', 'form_data')) {
                $table->dropColumn('form_data');
            }
            if (Schema::hasColumn('loan_applications', 'documents')) {
                $table->dropColumn('documents');
            }
        });
    }
};
