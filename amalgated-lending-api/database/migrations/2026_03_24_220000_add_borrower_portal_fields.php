<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('penalty_amount', 12, 2)->default(0)->after('amount_paid');
            $table->string('payment_method', 32)->nullable()->after('source');
            $table->string('receipt_path')->nullable()->after('payment_method');
            $table->string('receipt_name')->nullable()->after('receipt_path');
            $table->string('reference_number', 128)->nullable()->after('external_ref');
            $table->timestamp('submitted_at')->nullable()->after('paid_at');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('id_document_path')->nullable()->after('risk_level');
            $table->string('id_document_name')->nullable()->after('id_document_path');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn([
                'penalty_amount',
                'payment_method',
                'receipt_path',
                'receipt_name',
                'reference_number',
                'submitted_at',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['id_document_path', 'id_document_name']);
        });
    }
};
