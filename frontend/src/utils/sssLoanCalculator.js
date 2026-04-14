/**
 * Client-side mirror of pension-based principal estimate (for instant UI feedback).
 * Server `/public/loan-products/calculate` is authoritative.
 */
export function estimateSssPrincipal(monthlyPension, calculatorConfig = {}) {
  const mult = Number(calculatorConfig.pension_multiplier ?? 10)
  const cap = Number(calculatorConfig.max_principal ?? 500000)
  const p = Number(monthlyPension) || 0
  return Math.min(p * mult, cap)
}

export function monthlyAmortization(principal, monthlyRatePercent, termMonths) {
  const P = Number(principal)
  const n = Math.max(1, parseInt(termMonths, 10) || 1)
  const r = Number(monthlyRatePercent) / 100
  if (P <= 0) return 0
  if (r <= 0) return P / n
  const pow = (1 + r) ** n
  return (P * r * pow) / (pow - 1)
}

/** Principal ÷ term + full principal × monthly rate (business rule for REM/CHM / pension). */
export function straightLineMonthlyTotal(principal, monthlyRatePercent, termMonths) {
  const P = Number(principal)
  const n = Math.max(1, parseInt(termMonths, 10) || 1)
  const r = Number(monthlyRatePercent) / 100
  if (P <= 0) return 0
  return P / n + P * r
}

/** Travel assistance monthly renewal: interest on full principal only (illustrative). */
export function travelRenewalMonthlyInterest(principal, monthlyRatePercent) {
  const P = Number(principal)
  const r = Number(monthlyRatePercent) / 100
  if (P <= 0) return 0
  return P * r
}
