<?php

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $p = Permission::firstOrCreate(
            ['slug' => 'borrowers.delete'],
            ['name' => 'Delete borrowers', 'group_name' => 'Borrowers']
        );

        $super = Role::where('slug', 'super-admin')->first();
        if ($super) {
            $super->permissions()->syncWithoutDetaching([$p->id]);
        }
    }

    public function down(): void
    {
        Permission::where('slug', 'borrowers.delete')->delete();
    }
};
