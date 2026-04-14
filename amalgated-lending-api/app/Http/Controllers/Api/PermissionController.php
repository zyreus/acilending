<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PermissionController extends Controller
{
    public function store(Request $request, ActivityLogger $logger): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:permissions,slug|regex:/^[a-z0-9._-]+$/',
            'group_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $p = Permission::create($data);
        $logger->log($request->user(), 'permissions.create', $p);

        return response()->json(['ok' => true, 'permission' => $p], 201);
    }

    public function update(Request $request, Permission $permission, ActivityLogger $logger): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => ['sometimes', 'string', 'max:255', 'regex:/^[a-z0-9._-]+$/', Rule::unique('permissions', 'slug')->ignore($permission->id)],
            'group_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $permission->fill($data);
        $permission->save();

        $logger->log($request->user(), 'permissions.update', $permission);

        return response()->json(['ok' => true, 'permission' => $permission->fresh()]);
    }

    public function destroy(Request $request, Permission $permission, ActivityLogger $logger): JsonResponse
    {
        $logger->log($request->user(), 'permissions.delete', $permission);
        $permission->delete();

        return response()->json(['ok' => true]);
    }
}
