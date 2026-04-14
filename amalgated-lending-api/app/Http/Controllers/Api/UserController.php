<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = User::query()
            ->with('roles')
            ->withCount('loans');

        if ($search = $request->query('search')) {
            $s = '%'.$search.'%';
            $q->where(function ($w) use ($s) {
                $w->where('name', 'like', $s)
                    ->orWhere('email', 'like', $s)
                    ->orWhere('phone', 'like', $s)
                    ->orWhere('username', 'like', $s);
            });
        }
        if ($request->filled('is_active')) {
            $q->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $users = $q->orderByDesc('id')->paginate((int) $request->query('per_page', 15));

        return response()->json(['ok' => true, 'data' => $users]);
    }

    public function store(Request $request, ActivityLogger $logger): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:32',
            'is_active' => 'boolean',
            'role' => 'nullable|in:admin,loan_officer,collector,accountant,borrower',
            'role_ids' => 'array',
            'role_ids.*' => 'exists:roles,id',
        ]);

        $resolvedRole = $data['role'] ?? $this->deriveRoleFromRoleIds($data['role_ids'] ?? []) ?? 'borrower';

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'role' => $resolvedRole,
        ]);

        if (! empty($data['role_ids'])) {
            $user->roles()->sync($data['role_ids']);
        } elseif ($resolvedRole === 'borrower') {
            $borrowerRole = Role::where('slug', 'borrower')->first();
            if ($borrowerRole) {
                $user->roles()->syncWithoutDetaching([$borrowerRole->id]);
            }
        }

        $logger->log($request->user(), 'users.create', $user, ['email' => $user->email]);

        return response()->json(['ok' => true, 'user' => $user->load('roles')], 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json(['ok' => true, 'user' => $user->load('roles.permissions')]);
    }

    public function update(Request $request, User $user, ActivityLogger $logger): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:32',
            'is_active' => 'boolean',
            'role' => 'nullable|in:admin,loan_officer,collector,accountant,borrower',
            'role_ids' => 'array',
            'role_ids.*' => 'exists:roles,id',
        ]);

        if (isset($data['name'])) {
            $user->name = $data['name'];
        }
        if (isset($data['email'])) {
            $user->email = $data['email'];
        }
        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }
        if (array_key_exists('phone', $data)) {
            $user->phone = $data['phone'];
        }
        if (isset($data['is_active'])) {
            $user->is_active = $data['is_active'];
        }
        if (array_key_exists('role', $data) && $data['role']) {
            $user->role = $data['role'];
        }
        $user->save();

        if (isset($data['role_ids'])) {
            $user->roles()->sync($data['role_ids']);
            if (! isset($data['role'])) {
                $user->role = $this->deriveRoleFromRoleIds($data['role_ids']) ?? $user->role ?? 'borrower';
                $user->save();
            }
        } elseif (($user->role ?? '') === 'borrower') {
            $borrowerRole = Role::where('slug', 'borrower')->first();
            if ($borrowerRole) {
                $user->roles()->syncWithoutDetaching([$borrowerRole->id]);
            }
        }

        $logger->log($request->user(), 'users.update', $user);

        return response()->json(['ok' => true, 'user' => $user->fresh()->load('roles')]);
    }

    public function destroy(Request $request, User $user, ActivityLogger $logger): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['ok' => false, 'message' => 'Cannot delete yourself.'], 422);
        }
        $logger->log($request->user(), 'users.delete', $user);
        $user->delete();

        return response()->json(['ok' => true]);
    }

    private function deriveRoleFromRoleIds(array $roleIds): ?string
    {
        if (empty($roleIds)) {
            return null;
        }
        $slugs = Role::query()
            ->whereIn('id', $roleIds)
            ->pluck('slug')
            ->map(fn ($s) => strtolower((string) $s))
            ->all();

        if (in_array('super-admin', $slugs, true) || in_array('admin', $slugs, true) || in_array('admin-staff', $slugs, true)) {
            return 'admin';
        }
        if (in_array('loan-officer', $slugs, true)) {
            return 'loan_officer';
        }
        if (in_array('collector', $slugs, true)) {
            return 'collector';
        }
        if (in_array('accountant', $slugs, true)) {
            return 'accountant';
        }
        if (in_array('borrower', $slugs, true)) {
            return 'borrower';
        }

        return null;
    }
}
