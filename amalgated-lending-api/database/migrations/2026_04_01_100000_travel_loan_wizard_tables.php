<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('travel_loan_wizard_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_application_id')->unique()->constrained('loan_applications')->cascadeOnDelete();
            $table->json('wizard_data');
            $table->boolean('terms_accepted')->default(false);
            $table->timestamp('terms_accepted_at')->nullable();
            $table->longText('signature_data')->nullable();
            $table->date('signature_date')->nullable();
            $table->timestamps();
        });

        Schema::create('loan_application_dependents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_application_id')->constrained('loan_applications')->cascadeOnDelete();
            $table->string('name', 255);
            $table->date('birthdate')->nullable();
            $table->string('school_or_work', 500)->nullable();
            $table->timestamps();
            $table->index('loan_application_id');
        });

        Schema::create('loan_application_contact_persons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_application_id')->constrained('loan_applications')->cascadeOnDelete();
            $table->string('name', 255);
            $table->date('birthdate')->nullable();
            $table->string('school_or_work', 500)->nullable();
            $table->timestamps();
            $table->index('loan_application_id');
        });

        Schema::create('loan_credit_memoranda', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_application_id')->unique()->constrained('loan_applications')->cascadeOnDelete();
            $table->date('date_application_received')->nullable();
            $table->string('application_status', 32)->nullable();
            $table->string('documents_status', 32)->nullable();
            $table->string('payments_status', 32)->nullable();
            $table->string('recommended_by', 255)->nullable();
            $table->decimal('approved_rate', 10, 4)->nullable();
            $table->decimal('approved_amount', 14, 2)->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('approved_date')->nullable();
            $table->text('internal_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('loan_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->cascadeOnDelete();
            $table->string('borrower_name', 255)->nullable();
            $table->decimal('amount', 14, 2)->nullable();
            $table->decimal('interest', 14, 2)->nullable();
            $table->decimal('total_payable', 14, 2)->nullable();
            $table->json('meta')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index('loan_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_receipts');
        Schema::dropIfExists('loan_credit_memoranda');
        Schema::dropIfExists('loan_application_contact_persons');
        Schema::dropIfExists('loan_application_dependents');
        Schema::dropIfExists('travel_loan_wizard_forms');
    }
};
