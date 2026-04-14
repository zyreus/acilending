<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('face_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('borrower_id')->constrained('users')->cascadeOnDelete();
            $table->string('captured_image')->comment('Relative path under storage/app');
            $table->decimal('similarity_score', 6, 2)->nullable();
            $table->string('status', 16)->index();
            $table->timestamps();

            $table->index(['borrower_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('face_verifications');
    }
};
