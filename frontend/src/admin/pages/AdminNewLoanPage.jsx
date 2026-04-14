import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import { useAdminApiAuth } from '../context/useAdminApiAuth.js'
import { admin } from '../components/AdminUi.jsx'

export default function AdminNewLoanPage() {
  const { can } = useAdminApiAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    principal: '',
    term_months: '12',
    notes: '',
  })

  if (!can('loans.approve')) {
    return (
      <div className={`p-8 ${admin.cardNoHover}`}>
        <p className="text-gray-800 dark:text-gray-200">You don’t have permission to create loan applications.</p>
        <Link to="/admin/loans" className="mt-4 inline-block text-red-600 hover:underline dark:text-red-400">
          ← Back to loans
        </Link>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const principal = parseFloat(String(form.principal).replace(/,/g, ''))
    const term = parseInt(form.term_months, 10)
    if (!form.name?.trim() || !form.email?.trim() || !Number.isFinite(principal) || principal < 1000 || !term) {
      showToast('Check name, email, amount (≥ 1000), and term.', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await api('/loans', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone?.trim() || null,
          principal,
          term_months: term,
          application_payload: form.notes?.trim()
            ? { source: 'admin', admin_notes: form.notes.trim() }
            : { source: 'admin' },
        }),
      })
      showToast('Application created.', 'success')
      if (res.loan_id) navigate(`/admin/loans/${res.loan_id}`)
      else navigate('/admin/loans')
    } catch (err) {
      showToast(err.message || 'Failed to create application', 'error')
    } finally {
      setLoading(false)
    }
  }

  const labelClass = `text-[11px] font-semibold uppercase tracking-wider ${admin.textMuted}`

  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <Link to="/admin/loans" className="text-sm text-red-600 hover:underline dark:text-red-400">
          ← Loans
        </Link>
        <h1 className={`mt-2 ${admin.pageTitle}`}>New loan application</h1>
        <p className={admin.pageSubtitle}>Creates a pending loan for a borrower (same as the public apply form).</p>
      </div>

      <form onSubmit={handleSubmit} className={`space-y-4 p-6 ${admin.cardNoHover}`}>
        <label className="block">
          <span className={labelClass}>Borrower name *</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className={`mt-1 w-full ${admin.input}`}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Email *</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className={`mt-1 w-full ${admin.input}`}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Phone</span>
          <input name="phone" value={form.phone} onChange={handleChange} className={`mt-1 w-full ${admin.input}`} />
        </label>
        <label className="block">
          <span className={labelClass}>Principal (PHP) *</span>
          <input
            name="principal"
            type="number"
            min="1000"
            step="1"
            value={form.principal}
            onChange={handleChange}
            required
            className={`mt-1 w-full ${admin.input}`}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Term (months) *</span>
          <select
            name="term_months"
            value={form.term_months}
            onChange={handleChange}
            className={`mt-1 w-full ${admin.input}`}
          >
            {[3, 6, 12, 24, 36, 60].map((m) => (
              <option key={m} value={m}>
                {m} months
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Internal notes</span>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className={`mt-1 w-full resize-y ${admin.input}`}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-full ${admin.btnPrimary} py-3 disabled:opacity-50`}
        >
          {loading ? 'Creating…' : 'Create application'}
        </button>
      </form>
    </div>
  )
}
