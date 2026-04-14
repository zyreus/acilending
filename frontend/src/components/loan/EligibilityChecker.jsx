import { useState } from 'react'

/**
 * Lightweight eligibility hints — not a substitute for formal underwriting.
 */
export default function EligibilityChecker({ product, onClose }) {
  const [age, setAge] = useState('')
  const [pension, setPension] = useState('')

  const ageN = parseInt(age, 10)
  const safe = product?.safe_age
  const limit = product?.age_limit
  let status = 'neutral'
  let message = 'Enter your age to see a quick guideline for this product.'

  if (age && !Number.isNaN(ageN)) {
    if (limit != null && ageN > limit) {
      status = 'no'
      message = `This product lists a maximum age of ${limit}. You may need special approval.`
    } else if (safe != null && ageN > safe) {
      status = 'warn'
      message = `Preferred age for standard terms is up to ${safe}. Our team can still review your case.`
    } else {
      status = 'ok'
      message = 'Age appears within typical guidelines for this product (subject to full verification).'
    }
  }

  if (product?.slug === 'sss-gsis' && pension && Number(pension) > 0 && Number(pension) < 1000) {
    status = 'warn'
    message = 'Very low pension amounts may limit loanable principal — we will confirm during review.'
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="elig-title"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h2 id="elig-title" className="text-lg font-semibold text-slate-900 dark:text-white">
          Eligibility checker
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{product?.name}</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="elig-age">
              Your age
            </label>
            <input
              id="elig-age"
              type="number"
              min={18}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          {product?.slug === 'sss-gsis' ? (
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="elig-pen">
                Monthly pension (optional)
              </label>
              <input
                id="elig-pen"
                inputMode="decimal"
                value={pension}
                onChange={(e) => setPension(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          ) : null}
        </div>

        <div
          className={`mt-4 rounded-xl px-3 py-2 text-sm ${
            status === 'ok'
              ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
              : status === 'warn'
                ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100'
                : status === 'no'
                  ? 'bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100'
                  : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {message}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-brand-primary py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-hover"
        >
          Close
        </button>
      </div>
    </div>
  )
}
