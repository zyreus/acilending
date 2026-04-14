<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    public function index(): JsonResponse
    {
        $rows = SystemSetting::query()->orderBy('key')->get();
        $settings = [];
        foreach ($rows as $row) {
            $settings[$row->key] = [
                'key_name' => $row->key,
                'value' => $row->value ?? [],
                'updated_at' => $row->updated_at,
            ];
        }

        return response()->json(['ok' => true, 'settings' => $settings]);
    }

    public function show(string $key): JsonResponse
    {
        $row = SystemSetting::where('key', $key)->first();
        if (! $row) {
            return response()->json(['ok' => false, 'message' => 'Setting not found.'], 404);
        }

        return response()->json([
            'ok' => true,
            'setting' => [
                'key_name' => $row->key,
                'value' => $row->value ?? [],
                'updated_at' => $row->updated_at,
            ],
        ]);
    }

    public function upsert(Request $request, string $key, ActivityLogger $logger): JsonResponse
    {
        $data = $request->validate([
            'value' => 'required',
        ]);

        $value = $data['value'];
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json(['ok' => false, 'message' => 'Invalid JSON value.'], 422);
            }
            $value = $decoded;
        }
        if (! is_array($value)) {
            return response()->json(['ok' => false, 'message' => 'Setting value must be a JSON object/array.'], 422);
        }

        $row = SystemSetting::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );

        $logger->log($request->user(), 'settings.update', null, ['key' => $row->key]);

        return response()->json([
            'ok' => true,
            'setting' => [
                'key_name' => $row->key,
                'value' => $row->value ?? [],
                'updated_at' => $row->updated_at,
            ],
        ]);
    }
}
