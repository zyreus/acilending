import { Link } from 'react-router-dom'
import LoanProductIcon from './LoanProductIcon.jsx'
import { tierAccentClass, tierCardClass, tierIconWrapClass } from './loanProductStyles.js'

function shortDesc(text, max = 120) {
  if (!text) return ''
  const t = String(text).trim()
  return t.length <= max ? t : `${t.slice(0, max).trim()}…`
}

export default function LoanProductCard({
  product,
  compact = false,
  showApply = true,
}) {
  const tier = product.tier || 'blue'
  const rateLabel =
    product.rate_type === 'fixed'
      ? `${Number(product.interest_rate).toFixed(2)}% (fixed)`
      : `${Number(product.interest_rate).toFixed(2)}% / month`

  return (
    <article
      className={`group flex h-full flex-col rounded-2xl border p-5 transition-all duration-300 sm:p-6 ${tierCardClass(tier)}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105 ${tierIconWrapClass(tier)}`}
        >
          <LoanProductIcon iconKey={product.icon_key} className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold tracking-tight text-brand-text dark:text-white">{product.name}</h3>
          <p className={`mt-1 text-sm font-semibold ${tierAccentClass(tier)}`}>{rateLabel}</p>
        </div>
      </div>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-brand-text/80 dark:text-white/80">
        {compact ? shortDesc(product.description) : product.description}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to={`/loan-products#${product.slug}`}
          className="inline-flex flex-1 min-w-[8rem] items-center justify-center rounded-xl border border-brand-primary/30 bg-white/80 px-4 py-2.5 text-sm font-semibold text-brand-primary shadow-sm transition hover:bg-brand-primary hover:text-white dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-brand-primary"
        >
          View Details
        </Link>
        {showApply ? (
          <Link
            to={`/apply?product=${encodeURIComponent(product.slug)}`}
            className="inline-flex flex-1 min-w-[8rem] items-center justify-center rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-brand-primary transition hover:bg-brand-primary-hover"
          >
            Apply
          </Link>
        ) : null}
      </div>
    </article>
  )
}
