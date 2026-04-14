<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request, ActivityLogger $logger): JsonResponse
    {
        $data = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $login = trim($data['username']);
        $password = $data['password'];

        $lower = mb_strtolower($login);
        $user = User::query()
            ->where(function ($q) use ($lower) {
                $q->whereRaw('LOWER(username) = ?', [$lower])
                    ->orWhereRaw('LOWER(email) = ?', [$lower]);
            })
            ->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return response()->json([
                'ok' => false,
                'message' => 'Invalid username or password.',
            ], 401);
        }

        $token = auth('api')->login($user);

        /** @var User $user */
        $user = auth('api')->user();
        if (! $user->is_active) {
            auth('api')->logout();

            return response()->json(['ok' => false, 'message' => 'Account is deactivated.'], 403);
        }

        $logger->log($user, 'auth.login');

        return $this->respondWithToken($token, $user);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['roles.permissions']);

        return response()->json([
            'ok' => true,
            'user' => $user->toAuthPayload(),
        ]);
    }

    public function logout(Request $request, ActivityLogger $logger): JsonResponse
    {
        $logger->log($request->user(), 'auth.logout');
        auth('api')->logout();

        return response()->json(['ok' => true]);
    }

    public function refresh(): JsonResponse
    {
        $token = auth('api')->refresh();
        $user = auth('api')->user();

        return $this->respondWithToken($token, $user);
    }

    private function respondWithToken(string $token, User $user): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'token' => $token,
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => $user->toAuthPayload(),
        ]);
    }
}
