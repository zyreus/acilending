<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 32)->default('borrower')->after('is_active');
        });

        $map = [
            'super-admin' => 'admin',
            'admin' => 'admin',
            'admin-staff' => 'admin',
            'loan-officer' => 'loan_officer',
            'collector' => 'collector',
            'accountant' => 'accountant',
            'borrower' => 'borrower',
        ];

        foreach ($map as $slug => $role) {
            DB::table('users')
                ->join('role_user', 'users.id', '=', 'role_user.user_id')
                ->join('roles', 'role_user.role_id', '=', 'roles.id')
                ->where('roles.slug', $slug)
                ->update(['users.role' => $role]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
