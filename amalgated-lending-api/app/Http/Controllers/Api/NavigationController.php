<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminNavigationItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NavigationController extends Controller
{
    /**
     * Sidebar / mobile nav for the SPA — rows live in admin_navigation_items; visibility uses permission_slug + user.hasPermission.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $items = AdminNavigationItem::query()->orderBy('sort_order')->orderBy('id')->get();

        $filtered = $items->filter(function (AdminNavigationItem $item) use ($user) {
            if ($item->permission_slug === null || $item->permission_slug === '') {
                return true;
            }

            return $user->hasPermission($item->permission_slug);
        })->values();

        return response()->json(['ok' => true, 'data' => $filtered]);
    }
}
