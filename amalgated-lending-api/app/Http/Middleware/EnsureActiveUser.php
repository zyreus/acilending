<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureActiveUser
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if ($user && ! $user->is_active) {
            auth('api')->logout();

            return response()->json(['ok' => false, 'message' => 'Account is deactivated.'], 403);
        }

        return $next($request);
    }
}
