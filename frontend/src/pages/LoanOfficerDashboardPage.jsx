import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../admin/api/client.js'
import { admin as ui } from '../admin/components/AdminUi.jsx'
import { DarkTableSkeleton } from '../components/AppSkeletons.jsx'
import { getAuthUser } from '../auth/session.js'
import { logoutAndRedirect } from '../components/ProtectedRoute.jsx'

export default function LoanOfficerDashboardPage() {
  const navigate = useNavigate()
  const user = getAuthUser()
  const [pendingLoans, setPendingLoans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api('/loans?status=pending&per_page=8')
        const rows = res?.data?.data ?? []
        setPendingLoans(Array.isArray(rows) ? rows : [])
      } catch {
        setPendingLoans([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl min-w-0 space-y-6">
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-red-400">Loan Officer Dashboard</p>
          <h1 className="mt-2 text-2xl font-semibold">Hello, {user?.name || 'Officer'}</h1>
          <p className="mt-2 text-sm text-white/60">Review pending loan applications and process approvals.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Pending Applications</h2>
            <span className="text-xs text-white/50">{pendingLoans.length} item(s)</span>
          </div>
          {loading ? (
            <DarkTableSkeleton rows={5} cols={4} />
          ) : pendingLoans.length === 0 ? (
            <p className="mt-4 text-sm text-white/50">No pending loans found.</p>
          ) : (
            <div className={`${ui.tableScroll} mt-4`}>
              <table className={`${ui.tableBase} min-w-[720px] text-left text-white`}>
                <thead>
                  <tr className="border-b border-white/10 text-white/50">
                    <th className={`${ui.tableCell} text-left text-[11px] font-semibold uppercase tracking-wider`}>
                      Loan #
                    </th>
                    <th className={`${ui.tableCell} text-left text-[11px] font-semibold uppercase tracking-wider`}>
                      Borrower
                    </th>
                    <th className={`${ui.tableCell} text-left text-[11px] font-semibold uppercase tracking-wider`}>
                      Principal
                    </th>
                    <th className={`${ui.tableCell} text-left text-[11px] font-semibold uppercase tracking-wider`}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLoans.map((l) => (
                    <tr key={l.id} className="border-b border-white/5">
                      <td className={ui.tableCell}>#{l.id}</td>
                      <td className={`${ui.tableCell} break-words`}>{l.borrower?.name || '—'}</td>
                      <td className={ui.tableCell}>₱{Number(l.principal || 0).toLocaleString()}</td>
                      <td className={`${ui.tableCell} capitalize`}>{l.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => logoutAndRedirect(navigate)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
