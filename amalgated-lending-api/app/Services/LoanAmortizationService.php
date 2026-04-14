<?php

namespace App\Services;

/**
 * Fixed-rate monthly amortization (standard reducing balance).
 */
class LoanAmortizationService
{
    /**
     * @return array<int, array{installment_no:int, due_date:string, payment:float, principal:float, interest:float, balance:float}>
     */
    public function buildSchedule(
        float $principal,
        float $annualRatePercent,
        int $termMonths,
        ?\DateTimeInterface $firstDue = null
    ): array {
        $firstDue = $firstDue ? \DateTimeImmutable::createFromInterface($firstDue) : new \DateTimeImmutable('first day of next month');

        $monthlyRate = ($annualRatePercent / 100) / 12;
        $n = max(1, $termMonths);
        $payment = $this->monthlyPayment($principal, $monthlyRate, $n);

        $rows = [];
        $balance = $principal;
        $totalInterest = 0.0;

        for ($i = 1; $i <= $n; $i++) {
            $interest = round($balance * $monthlyRate, 2);
            $principalPart = round($payment - $interest, 2);
            if ($i === $n) {
                $principalPart = round($balance, 2);
                $paymentAdj = round($principalPart + $interest, 2);
            } else {
                $paymentAdj = round($principalPart + $interest, 2);
            }
            $balance = round($balance - $principalPart, 2);
            if ($balance < 0) {
                $balance = 0;
            }
            $totalInterest += $interest;

            $due = $firstDue->modify('+'.($i - 1).' months');

            $rows[] = [
                'installment_no' => $i,
                'due_date' => $due->format('Y-m-d'),
                'payment' => $paymentAdj,
                'principal' => $principalPart,
                'interest' => $interest,
                'balance' => max(0, $balance),
            ];
        }

        return [
            'rows' => $rows,
            'monthly_payment' => round($payment, 2),
            'total_interest' => round($totalInterest, 2),
        ];
    }

    private function monthlyPayment(float $principal, float $monthlyRate, int $n): float
    {
        if ($monthlyRate <= 0) {
            return round($principal / $n, 2);
        }
        $pow = pow(1 + $monthlyRate, $n);

        return $principal * ($monthlyRate * $pow) / ($pow - 1);
    }
}
