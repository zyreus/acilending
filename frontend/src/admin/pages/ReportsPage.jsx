import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import { downloadCsv, openPrintPdf } from '../utils/export.js'
import { admin } from '../components/AdminUi.jsx'

function fieldToInputDate(d) {
  if (!d) return ''
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) return ''
  return x.toISOString().slice(0, 10)
}

export default function ReportsPage() {
  const { showToast } = useToast()
  const [from, setFrom] = useState(() => fieldToInputDate(new Date(Date.now() - 90 * 86400000)))
  const [to, setTo] = useState(() => fieldToInputDate(new Date()))
  const [summary, setSummary] = useState(null)
  const [period, setPeriod] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (from) q.set('from', from)
      if (to) q.set('to', to)
      const res = await api(`/reports/summary?${q}`)
      setSummary(res.summary)
      setPeriod(res.period)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const fmtMoney = (n) =>
    typeof n === 'number' ? `₱${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'

  const exportRows = [
    ['Applications submitted', summary?.applications_submitted ?? 0],
    ['Loans disbursed', summary?.loans_disbursed ?? 0],
    ['Principal disbursed', summary?.principal_disbursed ?? 0],
    ['Collections', summary?.collections ?? 0],
  ]

  const handleCsvExport = () => {
    const suffix = `${from || 'from'}_${to || 'to'}`
    downloadCsv(`reports-summary-${suffix}.csv`, ['Metric', 'Value'], exportRows)
    showToast('Report CSV downloaded.', 'success')
  }

  const handlePdfExport = () => {
    const subtitle = `Period: ${from || 'N/A'} to ${to || 'N/A'}`
    const ok = openPrintPdf('Reports Summary', subtitle, ['Metric', 'Value'], exportRows)
    if (!ok) showToast('Please allow popups to export PDF.', 'error')
  }

  return (
    <div className="w-full min-w-0 space-y-8">
      <div>
        <h1 className={admin.pageTitle}>Reports</h1>
        <p className={admin.pageSubtitle}>
          Financial summary for the selected period — export to CSV or PDF.
        </p>
      </div>

      <div className={`flex flex-wrap items-end gap-3 p-4 sm:p-6 ${admin.cardNoHover}`}>
        <div>
          <label className={`block text-xs font-medium ${admin.textMuted}`} htmlFor="rep-from">
            From
          </label>
          <input
            id="rep-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={`mt-1 ${admin.input}`}
          />
        </div>
        <div>
          <label className={`block text-xs font-medium ${admin.textMuted}`} htmlFor="rep-to">
            To
          </label>
          <input
            id="rep-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={`mt-1 ${admin.input}`}
          />
        </div>
        <button type="button" onClick={load} className={admin.btnPrimary}>
          Apply Date Range
        </button>
        <button type="button" onClick={handleCsvExport} className={admin.btnSecondary}>
          Export CSV
        </button>
        <button type="button" onClick={handlePdfExport} className={admin.btnSecondary}>
          Export PDF
        </button>
      </div>

      {period && (
        <p className={`text-xs ${admin.textMuted}`}>
          Period: {new Date(period.from).toLocaleString()} — {new Date(period.to).toLocaleString()}
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className={`${admin.cardNoHover} animate-pulse p-6`}>
              <div className="h-3 w-28 rounded bg-gray-200 dark:bg-[#1F2937]" />
              <div className="mt-4 h-8 w-24 rounded bg-gray-200 dark:bg-[#1F2937]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Applications submitted', summary?.applications_submitted],
            ['Loans disbursed', summary?.loans_disbursed],
            ['Principal disbursed', fmtMoney(summary?.principal_disbursed)],
            ['Collections', fmtMoney(summary?.collections)],
          ].map(([label, val]) => (
            <div key={label} className={`${admin.card} p-6`}>
              <p className={`text-sm font-medium ${admin.textMuted}`}>{label}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{val ?? '—'}</p>
            </div>
          ))}
        </div>
      )}

      <p className={`text-xs ${admin.textMuted}`}>
        Tip: connect{' '}
        <code className="rounded bg-gray-100 px-1 py-0.5 text-[10px] text-gray-700 dark:bg-[#111827] dark:text-gray-400">
          GET /reports/summary
        </code>{' '}
        to scheduled exports and email delivery in production.
      </p>
    </div>
  )
}
