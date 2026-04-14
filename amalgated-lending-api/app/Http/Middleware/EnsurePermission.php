<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $permissionSlug)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['ok' => false, 'message' => 'Unauthenticated.'], 401);
        }
        if (! $user->hasPermission($permissionSlug)) {
            return response()->json(['ok' => false, 'message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
