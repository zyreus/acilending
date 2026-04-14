<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $totalUsers = User::count();

        $activeLoans = Loan::where('status', Loan::STATUS_ONGOING)->count();
        $pendingApplications = Loan::where('status', Loan::STATUS_PENDING)->count();
        $rejectedLoans = Loan::where('status', Loan::STATUS_REJECTED)->count();
        $completedLoans = Loan::where('status', Loan::STATUS_COMPLETED)->count();

        $totalPrincipalReleased = (float) Loan::query()
            ->whereIn('status', [Loan::STATUS_ONGOING, Loan::STATUS_COMPLETED])
            ->sum('principal');

        $totalRevenue = (float) Payment::sum('amount_paid');

        $overdueLoans = Loan::query()
            ->whereIn('status', [Loan::STATUS_ONGOING])
            ->whereHas('payments', function ($q) {
                $q->where('status', '!=', Payment::STATUS_PAID)
                    ->whereDate('due_date', '<', now()->toDateString());
            })
            ->count();

        return response()->json([
            'ok' => true,
            'summary' => [
                'total_users' => $totalUsers,
                'active_loans' => $activeLoans,
                'pending_applications' => $pendingApplications,
                'rejected_loans' => $rejectedLoans,
                'completed_loans' => $completedLoans,
                'total_principal_released' => round($totalPrincipalReleased, 2),
                'total_revenue' => round($totalRevenue, 2),
                'overdue_loans' => $overdueLoans,
            ],
        ]);
    }

    public function charts(): JsonResponse
    {
        $loanGrowth = [];
        $repayments = [];

        foreach (range(5, 0) as $i) {
            $start = now()->subMonths($i)->startOfMonth();
            $end = now()->subMonths($i)->endOfMonth();
            $ym = $start->format('Y-m');

            $loanGrowth[] = [
                'month' => $ym,
                'count' => Loan::whereBetween('created_at', [$start, $end])->count(),
            ];

            $repayments[] = [
                'month' => $ym,
                'amount' => round((float) Payment::whereBetween('paid_at', [$start, $end])->sum('amount_paid'), 2),
            ];
        }

        $revenueByMonth = [];
        foreach (range(5, 0) as $i) {
            $start = now()->subMonths($i)->startOfMonth();
            $end = now()->subMonths($i)->endOfMonth();
            $revenueByMonth[] = [
                'month' => $start->format('Y-m'),
                'revenue' => round((float) Payment::whereBetween('paid_at', [$start, $end])->sum('amount_paid'), 2),
            ];
        }

        return response()->json([
            'ok' => true,
            'loan_growth' => $loanGrowth,
            'repayments' => $repayments,
            'revenue_trend' => $revenueByMonth,
        ]);
    }
}
