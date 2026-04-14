<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::with('permissions')->orderBy('name')->get();

        return response()->json(['ok' => true, 'data' => $roles]);
    }

    public function store(Request $request, ActivityLogger $logger): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:roles,slug|regex:/^[a-z0-9_-]+$/',
            'description' => 'nullable|string',
            'permission_ids' => 'array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role = Role::create([
            'name' => $data['name'],
            'slug' => $data['slug'],
            'description' => $data['description'] ?? null,
        ]);

        if (! empty($data['permission_ids'])) {
            $role->permissions()->sync($data['permission_ids']);
        }

        $logger->log($request->user(), 'roles.create', $role);

        return response()->json(['ok' => true, 'role' => $role->load('permissions')], 201);
    }

    public function show(Role $role): JsonResponse
    {
        return response()->json(['ok' => true, 'role' => $role->load('permissions')]);
    }

    public function update(Request $request, Role $role, ActivityLogger $logger): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => ['sometimes', 'string', 'max:255', 'regex:/^[a-z0-9_-]+$/', Rule::unique('roles', 'slug')->ignore($role->id)],
            'description' => 'nullable|string',
            'permission_ids' => 'array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        if (isset($data['name'])) {
            $role->name = $data['name'];
        }
        if (isset($data['slug'])) {
            $role->slug = $data['slug'];
        }
        if (array_key_exists('description', $data)) {
            $role->description = $data['description'];
        }
        $role->save();

        if (isset($data['permission_ids'])) {
            $role->permissions()->sync($data['permission_ids']);
        }

        $logger->log($request->user(), 'roles.update', $role);

        return response()->json(['ok' => true, 'role' => $role->fresh()->load('permissions')]);
    }

    public function destroy(Request $request, Role $role, ActivityLogger $logger): JsonResponse
    {
        $logger->log($request->user(), 'roles.delete', $role);
        $role->delete();

        return response()->json(['ok' => true]);
    }

    public function permissionsIndex(): JsonResponse
    {
        $perms = Permission::orderBy('group_name')->orderBy('name')->get();

        return response()->json(['ok' => true, 'data' => $perms]);
    }
}
