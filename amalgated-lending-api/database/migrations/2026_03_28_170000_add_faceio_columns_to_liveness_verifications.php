<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('liveness_verifications', function (Blueprint $table) {
            $table->string('face_id', 512)->nullable()->after('borrower_id');
            $table->decimal('confidence', 10, 6)->nullable()->after('face_id')->comment('0–1 FaceIO confidence');
        });
    }

    public function down(): void
    {
        Schema::table('liveness_verifications', function (Blueprint $table) {
            $table->dropColumn(['face_id', 'confidence']);
        });
    }
};
