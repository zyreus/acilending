<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    public function requestBorrower(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);
        $email = mb_strtolower(trim($data['email']));

        $user = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();
        if ($user && $user->is_active && $user->canUseBorrowerPortal()) {
            try {
                $status = Password::sendResetLink(['email' => $user->email]);
                if ($status !== Password::RESET_LINK_SENT) {
                    Log::warning('borrower.password_reset_link_not_sent', [
                        'email' => $user->email,
                        'status' => $status,
                        'hint' => 'Check mail/Brevo config, throttle, or password broker.',
                    ]);
                } else {
                    Log::info('borrower.password_reset_link_sent', ['email' => $user->email]);
                }
            } catch (\Throwable $e) {
                Log::error('borrower.password_reset_exception', [
                    'email' => $user->email,
                    'message' => $e->getMessage(),
                ]);
                report($e);
            }
        } elseif ($user && $user->is_active) {
            Log::debug('borrower.password_reset_skipped_not_borrower', ['email' => $user->email]);
        }

        return response()->json([
            'ok' => true,
            'message' => 'If an account exists with that email, you will receive password reset instructions shortly.',
        ]);
    }

    public function requestAdmin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);
        $email = mb_strtolower(trim($data['email']));

        $user = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();
        if ($user && $user->is_active && $user->canAccessAdminPortal()) {
            try {
                $status = Password::sendResetLink(['email' => $user->email]);
                if ($status !== Password::RESET_LINK_SENT) {
                    Log::warning('admin.password_reset_link_not_sent', [
                        'email' => $user->email,
                        'status' => $status,
                    ]);
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'ok' => true,
            'message' => 'If an account exists with that email, you will receive password reset instructions shortly.',
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|max:72|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->setRememberToken(Str::random(60));

                $user->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'ok' => true,
                'message' => 'Your password has been reset. You can sign in with the new password.',
            ]);
        }

        return response()->json([
            'ok' => false,
            'message' => is_string($status) ? __($status) : 'Unable to reset password.',
        ], 422);
    }
}
