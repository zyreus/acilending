import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import { admin } from '../components/AdminUi.jsx'

export default function NotificationsPage() {
  const { showToast } = useToast()
  const [data, setData] = useState(null)

  const load = async () => {
    try {
      const res = await api('/notifications?per_page=30')
      setData(res.data)
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  useEffect(() => {
    load()
  }, [showToast])

  const rows = data?.data || []

  const markAll = async () => {
    try {
      await api('/notifications/read-all', { method: 'POST', body: '{}' })
      load()
      window.dispatchEvent(new CustomEvent('admin-notifications-changed'))
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  const markOne = async (id) => {
    try {
      await api(`/notifications/${id}/read`, { method: 'POST', body: '{}' })
      load()
      window.dispatchEvent(new CustomEvent('admin-notifications-changed'))
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={admin.pageTitle}>Notifications</h1>
          <p className={admin.pageSubtitle}>New loan applications and system events.</p>
        </div>
        <button
          type="button"
          onClick={markAll}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-800 transition hover:bg-gray-100 dark:border-white/15 dark:text-gray-100 dark:hover:bg-white/5"
        >
          Mark all read
        </button>
      </div>

      <ul className="space-y-3">
        {rows.map((n) => (
          <li
            key={n.id}
            className={`rounded-2xl border px-5 py-4 transition-colors duration-300 ${
              n.read_at
                ? 'border-gray-200 bg-gray-50 text-gray-600 dark:border-white/5 dark:bg-black/30 dark:text-gray-400'
                : 'border-red-300 bg-red-50 text-gray-900 dark:border-red-500/30 dark:bg-red-950/20 dark:text-gray-100'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{n.title}</p>
                {n.body && <p className={`mt-1 text-sm ${admin.textMuted}`}>{n.body}</p>}
                <p className={`mt-2 text-xs ${admin.textMuted}`}>{n.created_at}</p>
              </div>
              {!n.read_at ? (
                <button
                  type="button"
                  onClick={() => markOne(n.id)}
                  className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50 dark:border-white/15 dark:bg-transparent dark:text-gray-100 dark:hover:bg-white/5"
                >
                  Mark read
                </button>
              ) : null}
            </div>
          </li>
        ))}
        {rows.length === 0 && <p className={`text-sm ${admin.textMuted}`}>No notifications.</p>}
      </ul>
    </div>
  )
}
