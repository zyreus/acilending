<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_product_id')->constrained('loan_products')->cascadeOnDelete();
            $table->string('requirement_name', 500);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['loan_product_id', 'sort_order']);
        });

        Schema::create('document_loan_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('loan_product_id')->constrained('loan_products')->cascadeOnDelete();
            $table->string('status', 24)->default('pending')->index();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->index(['loan_product_id', 'status']);
        });

        Schema::create('uploaded_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_loan_application_id')->constrained('document_loan_applications')->cascadeOnDelete();
            $table->foreignId('loan_requirement_id')->constrained('loan_requirements')->cascadeOnDelete();
            $table->string('file_path', 500);
            $table->string('original_name', 500)->nullable();
            $table->string('status', 24)->default('pending')->index();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->unique(['document_loan_application_id', 'loan_requirement_id'], 'doc_app_requirement_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uploaded_documents');
        Schema::dropIfExists('document_loan_applications');
        Schema::dropIfExists('loan_requirements');
    }
};
