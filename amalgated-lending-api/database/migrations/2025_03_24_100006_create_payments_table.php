<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->cascadeOnDelete();
            $table->unsignedInteger('installment_no');
            $table->date('due_date');
            $table->decimal('amount_due', 15, 2);
            $table->decimal('principal_portion', 15, 2)->default(0);
            $table->decimal('interest_portion', 15, 2)->default(0);
            $table->decimal('amount_paid', 15, 2)->default(0);
            $table->timestamp('paid_at')->nullable();
            $table->string('status', 24)->default('pending')->index();
            $table->string('source', 24)->default('manual');
            $table->string('external_ref')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['loan_id', 'installment_no']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
