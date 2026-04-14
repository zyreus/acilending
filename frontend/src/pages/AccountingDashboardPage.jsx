import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../admin/api/client.js'
import { DarkCardsSkeleton } from '../components/AppSkeletons.jsx'
import { getAuthUser } from '../auth/session.js'
import { logoutAndRedirect } from '../components/ProtectedRoute.jsx'

export default function AccountingDashboardPage() {
  const navigate = useNavigate()
  const user = getAuthUser()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api('/reports/summary')
        setSummary(res?.data || null)
      } catch {
        setSummary(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const cards = [
    ['Total principal', `₱${Number(summary?.totals?.principal || 0).toLocaleString()}`],
    ['Outstanding', `₱${Number(summary?.totals?.outstanding || 0).toLocaleString()}`],
    ['Collected', `₱${Number(summary?.totals?.collected || 0).toLocaleString()}`],
  ]

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-red-400">Accounting Dashboard</p>
          <h1 className="mt-2 text-2xl font-semibold">Hello, {user?.name || 'Accountant'}</h1>
          <p className="mt-2 text-sm text-white/60">Financial snapshot from lending reports.</p>
        </div>

        {loading ? (
          <DarkCardsSkeleton cards={3} />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {cards.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
                <p className="text-xs text-white/50">{label}</p>
                <p className="mt-2 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        )}

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
