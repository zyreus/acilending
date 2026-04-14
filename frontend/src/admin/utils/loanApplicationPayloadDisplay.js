/**
 * Keys omitted from admin Borrower / Users summaries — co-maker data belongs on the loan application / print only.
 */
export const ADMIN_OMIT_LOAN_PAYLOAD_KEYS = new Set([
  'co_maker_statement',
  'co_maker_id',
  'co_maker_name',
  'co_maker_email',
  'co_maker_phone',
  'include_co_maker',
  'includeCoMaker',
])

export const PAYLOAD_LABELS = {
  full_name: 'Full name (as submitted)',
  email: 'Email',
  phone: 'Phone',
  date_of_birth: 'Date of birth',
  address: 'Address',
  city: 'City',
  province: 'Province',
  employment_status: 'Employment status',
  employer_name: 'Employer',
  monthly_income: 'Monthly income',
  years_employed: 'Years employed',
  loan_type: 'Loan type',
  loan_amount: 'Requested amount',
  loan_term_months: 'Term (months)',
  selected_interest_rate: 'Product interest rate (%)',
  selected_rate_type: 'Rate type',
  purpose: 'Purpose',
  id_type: 'ID type',
  id_number: 'ID number',
}

export function formatPayloadValue(key, raw) {
  if (raw === null || raw === undefined || raw === '') return null
  if (ADMIN_OMIT_LOAN_PAYLOAD_KEYS.has(key)) return null
  if (key === 'monthly_income' || key === 'loan_amount') {
    const n = Number(raw)
    if (!Number.isFinite(n)) return String(raw)
    return `₱${n.toLocaleString()}`
  }
  return String(raw)
}

export function applicationPayloadRows(payload) {
  if (!payload || typeof payload !== 'object') return []
  const keys = Object.keys(payload).sort((a, b) => {
    const oa = PAYLOAD_LABELS[a] ? Object.keys(PAYLOAD_LABELS).indexOf(a) : 999
    const ob = PAYLOAD_LABELS[b] ? Object.keys(PAYLOAD_LABELS).indexOf(b) : 999
    if (oa !== ob) return oa - ob
    return a.localeCompare(b)
  })
  const rows = []
  for (const key of keys) {
    if (ADMIN_OMIT_LOAN_PAYLOAD_KEYS.has(key)) continue
    const display = formatPayloadValue(key, payload[key])
    if (display == null) continue
    rows.push({
      key,
      label: PAYLOAD_LABELS[key] || key.replace(/_/g, ' '),
      value: display,
    })
  }
  return rows
}
