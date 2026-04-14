import { useNavigate } from 'react-router-dom'
import { getAuthUser } from '../auth/session.js'
import { logoutAndRedirect } from '../components/ProtectedRoute.jsx'

export default function BorrowerDashboardPage() {
  const navigate = useNavigate()
  const user = getAuthUser()

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-red-400">Borrower Dashboard</p>
          <h1 className="mt-2 text-2xl font-semibold">Welcome, {user?.name || 'Borrower'}</h1>
          <p className="mt-2 text-sm text-white/60">
            Track your applications and payment status here.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <p className="text-xs text-white/50">Current Role</p>
            <p className="mt-1 text-lg font-semibold capitalize">{(user?.role || 'borrower').replace('_', ' ')}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <p className="text-xs text-white/50">Email</p>
            <p className="mt-1 text-sm">{user?.email || '—'}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <p className="text-xs text-white/50">Loan status</p>
            <p className="mt-1 text-sm text-white/80">Use Apply page to submit/continue applications.</p>
          </div>
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
