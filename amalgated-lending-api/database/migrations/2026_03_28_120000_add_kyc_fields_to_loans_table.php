<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->string('face_photo_path')->nullable()->after('application_payload');
            $table->timestamp('face_capture_at')->nullable()->after('face_photo_path');
            $table->json('kyc_documents')->nullable()->after('face_capture_at');
        });
    }

    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn(['face_photo_path', 'face_capture_at', 'kyc_documents']);
        });
    }
};
