<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_products', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 80)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('interest_rate', 10, 4);
            $table->string('rate_type', 20)->default('monthly'); // monthly | fixed
            $table->text('collateral')->nullable();
            $table->text('requirements')->nullable();
            $table->unsignedSmallInteger('max_term')->nullable()->comment('months');
            $table->unsignedSmallInteger('age_limit')->nullable();
            $table->unsignedSmallInteger('safe_age')->nullable();
            $table->string('downpayment', 120)->nullable();
            $table->string('status', 20)->default('active'); // active | inactive
            /** Display tier for frontend color: green | blue | orange */
            $table->string('tier', 20)->default('blue');
            $table->string('icon_key', 40)->nullable();
            $table->decimal('sample_monthly_pension', 12, 2)->nullable();
            $table->text('sample_computation_note')->nullable();
            /** SSS/GSIS calculator: pension_multiplier, max_principal, etc. */
            $table->json('calculator_config')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_products');
    }
};
