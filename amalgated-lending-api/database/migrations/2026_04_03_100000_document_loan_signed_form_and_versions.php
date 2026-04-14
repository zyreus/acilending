<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_loan_applications', function (Blueprint $table) {
            $table->string('signed_form_path', 500)->nullable()->after('submitted_at');
            $table->boolean('is_signed')->default(false)->after('signed_form_path');
        });

        Schema::table('uploaded_documents', function (Blueprint $table) {
            $table->unsignedInteger('version')->default(1)->after('remarks');
        });

        Schema::create('document_upload_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uploaded_document_id')->constrained('uploaded_documents')->cascadeOnDelete();
            $table->string('file_path', 500);
            $table->string('original_name', 500)->nullable();
            $table->unsignedInteger('version');
            $table->timestamps();
            $table->index(['uploaded_document_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_upload_histories');

        Schema::table('uploaded_documents', function (Blueprint $table) {
            $table->dropColumn('version');
        });

        Schema::table('document_loan_applications', function (Blueprint $table) {
            $table->dropColumn(['signed_form_path', 'is_signed']);
        });
    }
};
