<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAdminRole
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (! $user || ! $user->canAccessAdminPortal()) {
            return response()->json(['ok' => false, 'message' => 'Admin access required.'], 403);
        }

        return $next($request);
    }
}
