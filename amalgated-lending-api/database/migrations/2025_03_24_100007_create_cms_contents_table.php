<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_contents', function (Blueprint $table) {
            $table->id();
            $table->string('section_key')->index();
            $table->string('locale', 8)->default('en');
            $table->string('title')->nullable();
            $table->longText('body')->nullable();
            $table->json('meta')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['section_key', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_contents');
    }
};
