<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('loan_id')->nullable()->constrained('loans')->nullOnDelete();
            $table->string('loan_type', 40)->default('chattel')->index();
            $table->foreignId('co_maker_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('co_maker_name')->nullable();
            $table->string('co_maker_email')->nullable();
            $table->string('co_maker_phone', 32)->nullable();
            $table->string('tin_number', 64)->nullable();
            $table->text('stencil_text')->nullable();
            $table->string('status', 24)->default('pending')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_applications');
    }
};
