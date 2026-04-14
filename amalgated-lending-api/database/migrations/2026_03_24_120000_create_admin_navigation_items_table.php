<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_navigation_items', function (Blueprint $table) {
            $table->id();
            $table->string('path')->unique();
            $table->string('label');
            $table->string('icon_key')->default('dash');
            $table->unsignedInteger('sort_order')->default(0);
            /** Null = any signed-in admin (e.g. CRM). Otherwise must match permissions.slug. */
            $table->string('permission_slug')->nullable()->index();
            $table->boolean('match_end')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_navigation_items');
    }
};
