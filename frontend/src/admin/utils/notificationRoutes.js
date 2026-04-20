/**
 * Deep-link target for admin notification list items (matches Laravel AdminNotification `type` + `data`).
 * @param {{ type?: string, data?: Record<string, unknown> | null }} | null | undefined} n
 * @returns {string | null} In-app path, or null when unknown / no target
 */
export function getAdminNotificationHref(n) {
  if (!n || typeof n !== 'object') return null
  const type = String(n.type || '').trim()
  const raw = n.data
  const d = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  const loanId = d.loan_id ?? d.loanId
  const borrowerId = d.borrower_id ?? d.borrowerId

  if (type === 'borrower_payment_submitted') {
    if (loanId != null && String(loanId).trim() !== '') {
      return `/admin/payments?loan_search=${encodeURIComponent(String(loanId).trim())}`
    }
    if (borrowerId != null && String(borrowerId).trim() !== '') {
      return `/admin/borrowers/${String(borrowerId).trim()}`
    }
    return '/admin/payments'
  }

  if (type === 'loan_submitted') {
    if (loanId != null && String(loanId).trim() !== '') {
      return `/admin/loans/${String(loanId).trim()}`
    }
  }

  return null
}
