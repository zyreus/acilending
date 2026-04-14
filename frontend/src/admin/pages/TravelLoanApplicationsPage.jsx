import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getToken } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import { useAdminApiAuth } from '../context/useAdminApiAuth.js'
import { admin } from '../components/AdminUi.jsx'
import { AdminPageSkeleton } from '../../components/AppSkeletons.jsx'
import { laravelApiBases, normalizeLaravelApiBase } from '../../utils/lendingLaravelApi.js'

export default function TravelLoanApplicationsPage() {
  const { showToast } = useToast()
  const { can } = useAdminApiAuth()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [filterKey, setFilterKey] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      q.set('per_page', '20')
      q.set('page', String(page))
      if (search.trim()) q.set('search', search.trim())
      if (status) q.set('status', status)
      if (dateFrom) q.set('date_from', dateFrom)
      if (dateTo) q.set('date_to', dateTo)
      const res = await api(`/loan/list?${q.toString()}`)
      setRows(res?.data?.data ?? [])
      setMeta(res?.data ?? null)
    } catch (e) {
      showToast(e.message, 'error')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, search, status, dateFrom, dateTo, showToast, filterKey])

  useEffect(() => {
    load()
  }, [load])

  const exportCsv = async () => {
    try {
      const bases = laravelApiBases().map((b) => normalizeLaravelApiBase(b) || '').filter(Boolean)
      const base = bases[0] || ''
      const q = new URLSearchParams()
      if (search.trim()) q.set('search', search.trim())
      if (status) q.set('status', status)
      const path = `${base}/loan/export?${q.toString()}`
      const url = path.startsWith('http') ? path : `/api/v1/loan/export?${q.toString()}`
      const token = getToken()
      const res = await fetch(url, {
        headers: { Accept: 'text/csv', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!res.ok) throw new Error(`Export failed (${res.status})`)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'travel-loan-applications.csv'
      a.click()
      URL.revokeObjectURL(a.href)
      showToast('Export started.', 'success')
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  if (!can('loans.view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-600 dark:text-gray-300">You don&apos;t have permission to view loan applications.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Travel Assistance (wizard)</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Applications submitted via the full travel loan form.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can('loans.approve') ? (
            <button type="button" onClick={exportCsv} className={admin.btnSecondary}>
              Export CSV
            </button>
          ) : null}
          <Link to="/admin/loans" className={admin.btnSecondary}>
            All loans
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
          Search name / email
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="Applicant…"
          />
        </label>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Any</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
          From date
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </label>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
          To date
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setPage(1)
            setFilterKey((k) => k + 1)
          }}
          className={admin.btnPrimary}
        >
          Apply filters
        </button>
        <button
          type="button"
          onClick={() => {
            setSearch('')
            setStatus('')
            setDateFrom('')
            setDateTo('')
            setPage(1)
            setFilterKey((k) => k + 1)
          }}
          className={admin.btnSecondary}
        >
          Clear
        </button>
      </div>

      {loading ? (
        <AdminPageSkeleton className="mt-8" />
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/80">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Borrower</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Principal</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">App status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Loan</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Created</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No travel wizard applications found.
                  </td>
                </tr>
              ) : (
                rows.map((app) => {
                  const b = app.borrower
                  const loan = app.loan
                  return (
                    <tr key={app.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                      <td className="px-4 py-3 font-mono text-gray-800 dark:text-gray-100">{app.id}</td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{b?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-100">
                        {loan?.principal != null ? `₱${Number(loan.principal).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-800 dark:text-gray-100">{app.status || '—'}</td>
                      <td className="px-4 py-3 capitalize text-gray-800 dark:text-gray-100">{loan?.status || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {app.created_at ? String(app.created_at).slice(0, 16).replace('T', ' ') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {loan?.id ? (
                          <Link to={`/admin/loans/${loan.id}`} className="font-medium text-red-600 hover:underline dark:text-red-400">
                            Open loan
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {meta?.last_page > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600"
          >
            Previous
          </button>
          <span>
            Page {meta.current_page} of {meta.last_page}
          </span>
          <button
            type="button"
            disabled={page >= (meta.last_page || 1)}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  )
}
