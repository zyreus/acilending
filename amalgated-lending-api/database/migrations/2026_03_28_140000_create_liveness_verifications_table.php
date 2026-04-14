<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('liveness_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('borrower_id')->constrained('users')->cascadeOnDelete();
            $table->json('images')->nullable()->comment('Stored relative paths for action frames');
            $table->string('final_image')->nullable()->comment('Relative path for final selfie');
            $table->decimal('similarity_score', 6, 2)->nullable();
            $table->string('status', 16)->index();
            $table->string('failure_reason')->nullable();
            $table->timestamps();

            $table->index(['borrower_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('liveness_verifications');
    }
};
