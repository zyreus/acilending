<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureBorrowerRole
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (! $user || ! $user->canUseBorrowerPortal()) {
            return response()->json(['ok' => false, 'message' => 'Borrower access required.'], 403);
        }

        return $next($request);
    }
}
