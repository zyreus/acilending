/** Tailwind card shells by marketing tier */
export function tierCardClass(tier) {
  switch (tier) {
    case 'green':
      return 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white text-emerald-950 shadow-sm hover:border-emerald-300 hover:shadow-md dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-[#0f172a] dark:text-emerald-50'
    case 'orange':
      return 'border-amber-200/80 bg-gradient-to-br from-amber-50 to-white text-amber-950 shadow-sm hover:border-amber-300 hover:shadow-md dark:border-amber-900/50 dark:from-amber-950/30 dark:to-[#0f172a] dark:text-amber-50'
    default:
      return 'border-slate-200/90 bg-gradient-to-br from-slate-50 to-white text-slate-900 shadow-sm hover:border-sky-300 hover:shadow-md dark:border-slate-700 dark:from-slate-900/50 dark:to-[#0f172a] dark:text-slate-100'
  }
}

export function tierAccentClass(tier) {
  switch (tier) {
    case 'green':
      return 'text-emerald-700 dark:text-emerald-300'
    case 'orange':
      return 'text-amber-800 dark:text-amber-200'
    default:
      return 'text-sky-700 dark:text-sky-300'
  }
}

export function tierIconWrapClass(tier) {
  switch (tier) {
    case 'green':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
    case 'orange':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'
    default:
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200'
  }
}
