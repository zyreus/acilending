<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoanApplication;
use App\Models\Role;
use App\Models\User;
use App\Support\SignedPrintUrls;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BorrowerController extends Controller
{
    /**
     * Users with the borrower role — CRM / loan history context.
     */
    public function index(Request $request): JsonResponse
    {
        $q = User::query()
            ->withCount(['loans', 'loanApplications', 'livenessVerifications', 'faceVerifications'])
            ->with(['roles']);
        // Admin borrower list should show applicants / actual borrowers only.
        // Co-maker-only accounts stay accessible through the applicant's borrower detail / loan detail.
        // Include users with identity-verification history so portal checks are visible in Admin > Borrowers.
        $q->where(function ($w) {
            $w->whereHas('loanApplications')
                ->orWhereHas('loans')
                ->orWhereHas('livenessVerifications')
                ->orWhereHas('faceVerifications');
        });

        if ($search = $request->query('search')) {
            $q->where(function ($w) use ($search) {
                $w->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('phone', 'like', '%'.$search.'%');
            });
        }

        if ($request->filled('risk_level')) {
            $q->where('risk_level', $request->query('risk_level'));
        }

        $rows = $q->orderByDesc('id')->paginate((int) $request->query('per_page', 15));

        return response()->json(['ok' => true, 'data' => $rows]);
    }

    public function show(User $borrower): JsonResponse
    {
        $hasApplicantHistory = $borrower->loanApplications()->exists();
        $hasLoanAsBorrower = $borrower->loans()->exists();
        $hasLivenessHistory = $borrower->livenessVerifications()->exists();
        $hasFaceHistory = $borrower->faceVerifications()->exists();
        if (! $hasApplicantHistory && ! $hasLoanAsBorrower && ! $hasLivenessHistory && ! $hasFaceHistory) {
            return response()->json(['ok' => false, 'message' => 'User is not a borrower.'], 404);
        }

        $borrower->load([
            'roles',
            'loans' => function ($q) {
                $q->with([
                    'loanApplication:id,loan_id,loan_type,co_maker_id,co_maker_name,co_maker_email,co_maker_phone',
                    'loanApplication.coMaker:id,name,email',
                ])
                    ->orderByDesc('id')
                    ->limit(50);
            },
            'livenessVerifications' => function ($q) {
                $q->orderByDesc('id')->limit(20);
            },
            'faceVerifications' => function ($q) {
                $q->orderByDesc('id')->limit(20);
            },
        ]);

        $borrower->loans->each(function ($loan) {
            $la = $loan->loanApplication;
            $loan->setAttribute(
                'print_application_url',
                $la
                    ? SignedPrintUrls::temporaryRoute(
                        'print.general-loan',
                        now()->addMinutes(45),
                        ['loanApplication' => $la->id]
                    )
                    : null
            );
            $hasSchedule = is_array($loan->schedule_json) && count($loan->schedule_json) > 0;
            $loan->setAttribute(
                'print_statement_url',
                $hasSchedule
                    ? SignedPrintUrls::temporaryRoute(
                        'print.loan-soa',
                        now()->addMinutes(45),
                        ['loan' => $loan->id]
                    )
                    : null
            );
        });

        return response()->json(['ok' => true, 'borrower' => $borrower]);
    }

    /**
     * Remove a borrower account (no loans or application history).
     * Admin users cannot be deleted from this endpoint.
     */
    public function destroy(Request $request, User $borrower): JsonResponse
    {
        $admin = $request->user();
        if (! $admin) {
            return response()->json(['ok' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $role = Role::where('slug', 'borrower')->first();
        $hasBorrowerPivot = $role && $borrower->roles()->where('roles.id', $role->id)->exists();
        $hasBorrowerColumn = ($borrower->role ?? '') === 'borrower';
        $hasLoanAsBorrower = $borrower->loans()->exists();
        if (! $hasBorrowerPivot && ! $hasBorrowerColumn && ! $hasLoanAsBorrower) {
            return response()->json(['ok' => false, 'message' => 'User is not a borrower.'], 404);
        }

        if ($borrower->id === $admin->id) {
            return response()->json(['ok' => false, 'message' => 'You cannot delete your own account.'], 403);
        }

        if ($borrower->canAccessAdminPortal()) {
            return response()->json(['ok' => false, 'message' => 'Cannot delete a user with admin portal access.'], 403);
        }

        if ($borrower->loans()->exists()) {
            return response()->json([
                'ok' => false,
                'message' => 'Cannot delete borrower with existing loan records. Close or archive loans first.',
            ], 422);
        }

        if (LoanApplication::where('user_id', $borrower->id)->exists()) {
            return response()->json([
                'ok' => false,
                'message' => 'Cannot delete borrower with loan application history.',
            ], 422);
        }

        DB::transaction(function () use ($borrower) {
            $borrower->roles()->detach();
            $borrower->delete();
        });

        return response()->json(['ok' => true, 'message' => 'Borrower account deleted.']);
    }
}
