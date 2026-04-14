import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import { useAdminApiAuth } from '../context/useAdminApiAuth.js'
import { admin } from '../components/AdminUi.jsx'
import { AdminPageSkeleton } from '../../components/AppSkeletons.jsx'

export default function DocumentLoanApplicationsPage() {
  const { showToast } = useToast()
  const { can } = useAdminApiAuth()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      q.set('per_page', '20')
      q.set('page', String(page))
      if (appliedSearch.trim()) q.set('search', appliedSearch.trim())
      const res = await api(`/document-loan-applications?${q.toString()}`)
      const paginator = res?.data
      setRows(Array.isArray(paginator?.data) ? paginator.data : [])
      setMeta(paginator || null)
    } catch (e) {
      showToast(e.message, 'error')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, appliedSearch, showToast])

  useEffect(() => {
    load()
  }, [load])

  if (!can('loans.view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-600 dark:text-gray-300">You don&apos;t have permission to view document applications.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Document-only applications</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Upload-based loan applications (requirements checklist per product).
          </p>
        </div>
        <Link to="/admin/loans" className={admin.btnSecondary}>
          All loans
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Search borrower</label>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAppliedSearch(searchInput.trim())
                setPage(1)
              }
            }}
            placeholder="Name or email"
            className="mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setAppliedSearch(searchInput.trim())
            setPage(1)
          }}
          className={admin.btnSecondary}
        >
          Search
        </button>
      </div>

      {loading ? (
        <AdminPageSkeleton className="mt-8" />
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/80">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Borrower</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Product</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Submitted</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900/40">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-900 dark:text-gray-100">{row.id}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    <div className="font-medium">{row.user?.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{row.user?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{row.loan_product?.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-900 dark:text-gray-100">{row.status}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                    {row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link
                      to={`/admin/document-loan-applications/${row.id}`}
                      className="font-semibold text-red-600 hover:underline dark:text-red-400"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No applications found.</p>
          ) : null}
        </div>
      )}

      {meta && meta.last_page > 1 ? (
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
            disabled={page >= meta.last_page}
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
