<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = ActivityLog::query()->with('user');

        if ($request->filled('action')) {
            $q->where('action', 'like', '%'.$request->query('action').'%');
        }

        $logs = $q->orderByDesc('id')->paginate((int) $request->query('per_page', 25));

        return response()->json(['ok' => true, 'data' => $logs]);
    }
}
