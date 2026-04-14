import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import { admin, TableSkeletonRows, EmptyTableRow } from '../components/AdminUi.jsx'

export default function ActivityPage() {
  const { showToast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api('/activity-logs?per_page=30')
        setData(res.data)
      } catch (e) {
        showToast(e.message, 'error')
      } finally {
        setLoading(false)
      }
    })()
  }, [showToast])

  const rows = data?.data || []

  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h1 className={admin.pageTitle}>Activity Logs</h1>
        <p className={admin.pageSubtitle}>Logins, approvals, and key actions — audit trail.</p>
      </div>

      <div className="space-y-3 lg:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${admin.cardNoHover} p-4`}>
              <div className="h-3 w-44 animate-pulse rounded bg-gray-200 dark:bg-[#1F2937]" />
              <div className="mt-2 h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-[#1F2937]" />
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className={`${admin.cardNoHover} p-4 text-sm ${admin.textMuted}`}>No activity recorded.</div>
        ) : (
          rows.map((log) => (
            <div key={log.id} className={`${admin.cardNoHover} space-y-1 p-4`}>
              <p className={`text-xs ${admin.tableMuted}`}>{log.created_at}</p>
              <p className="text-sm break-words text-gray-900 dark:text-gray-100">{log.user?.email || '—'}</p>
              <p className="break-words font-mono text-[11px] text-red-600 dark:text-red-400/95">{log.action}</p>
            </div>
          ))
        )}
      </div>

      <div className={`hidden lg:block ${admin.tableWrap}`}>
        <table className={`${admin.tableBase} ${admin.tableText} ${admin.tableMin800}`}>
          <thead>
            <tr className={admin.thead}>
              <th className={admin.tableCell}>When</th>
              <th className={admin.tableCell}>User</th>
              <th className={`${admin.tableCell} min-w-[10rem]`}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows cols={3} rows={6} />
            ) : rows.length === 0 ? (
              <EmptyTableRow colSpan={3} message="No activity recorded." />
            ) : (
              rows.map((log) => (
                <tr key={log.id} className={admin.tbodyRow}>
                  <td className={`${admin.tableCell} ${admin.tableMuted}`}>{log.created_at}</td>
                  <td className={`${admin.tableCell} break-words`}>{log.user?.email || '—'}</td>
                  <td className={`${admin.tableCell} break-words font-mono text-[11px] text-red-600 sm:text-xs dark:text-red-400/95`}>
                    {log.action}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
