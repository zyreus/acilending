<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $from = $request->query('from')
            ? Carbon::parse($request->query('from'))->startOfDay()
            : now()->subMonths(3)->startOfDay();
        $to = $request->query('to')
            ? Carbon::parse($request->query('to'))->endOfDay()
            : now()->endOfDay();

        $applications = Loan::query()->whereBetween('created_at', [$from, $to]);

        $disbursed = Loan::query()
            ->whereBetween('disbursed_at', [$from, $to])
            ->whereIn('status', [Loan::STATUS_ONGOING, Loan::STATUS_COMPLETED]);

        $collections = Payment::query()
            ->whereBetween('paid_at', [$from, $to])
            ->whereNotNull('paid_at');

        return response()->json([
            'ok' => true,
            'period' => [
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
            ],
            'summary' => [
                'applications_submitted' => (clone $applications)->count(),
                'loans_disbursed' => (clone $disbursed)->count(),
                'principal_disbursed' => round((float) (clone $disbursed)->sum('principal'), 2),
                'collections' => round((float) $collections->sum('amount_paid'), 2),
            ],
        ]);
    }
}
