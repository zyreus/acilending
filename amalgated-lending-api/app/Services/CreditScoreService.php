<?php

namespace App\Services;

use App\Models\Loan;
use App\Models\Payment;
use App\Models\User;

class CreditScoreService
{
    private const MIN_SCORE = 300;

    private const MAX_SCORE = 850;

    /**
     * Heuristic score from payment history + loan outcomes.
     */
    public function recalculateForUser(User $user): void
    {
        $base = 520.0;

        $loans = Loan::where('borrower_id', $user->id)->get();
        $completed = $loans->where('status', Loan::STATUS_COMPLETED)->count();
        $rejected = $loans->where('status', Loan::STATUS_REJECTED)->count();

        $loanIds = $loans->pluck('id');
        $payments = Payment::whereIn('loan_id', $loanIds)->get();

        $onTime = 0;
        $late = 0;
        foreach ($payments as $p) {
            if ((float) $p->amount_paid <= 0) {
                continue;
            }
            if ($p->status === Payment::STATUS_OVERDUE) {
                $late++;
                continue;
            }
            if (in_array($p->status, [Payment::STATUS_PAID, Payment::STATUS_PARTIAL], true) && $p->paid_at && $p->due_date) {
                if ($p->paid_at->lte($p->due_date->copy()->endOfDay())) {
                    $onTime++;
                } else {
                    $late++;
                }
            }
        }

        $score = $base + ($onTime * 4.5) - ($late * 12) + ($completed * 35) - ($rejected * 5);
        $score = max(self::MIN_SCORE, min(self::MAX_SCORE, $score));

        $risk = 'high';
        if ($score >= 700) {
            $risk = 'low';
        } elseif ($score >= 560) {
            $risk = 'medium';
        }

        $user->credit_score = round($score, 2);
        $user->risk_level = $risk;
        $user->save();
    }
}
