import { useEffect, useState } from 'react'
import { Tabs } from '../../components/Tabs'
import { useToast } from '../../hooks/useToast'
import { getReport, type ReportRow, type ReportType } from '../../services/reports'

const REPORT_TABS: { key: ReportType; label: string }[] = [
  { key: 'sales', label: 'Sales' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'orders', label: 'Orders' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'customer', label: 'Customer' },
  { key: 'returns', label: 'Returns' },
]

export function ReportsPage() {
  const { showToast } = useToast()
  const [tab, setTab] = useState<ReportType>('sales')
  const [rows, setRows] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('2026-08-01')
  const [dateTo, setDateTo] = useState('2026-09-12')

  useEffect(() => {
    setLoading(true)
    getReport(tab).then((result) => {
      setRows(result)
      setLoading(false)
    })
  }, [tab])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Reports</h1>
          <p className="mt-1 text-sm text-ink-soft">Sales, revenue, orders, inventory, customer, and returns.</p>
        </div>
        <button
          onClick={() => showToast('Export started — check your downloads shortly.', 'info')}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bone-deep"
        >
          Export CSV
        </button>
      </div>

      <Tabs tabs={REPORT_TABS} active={tab} onChange={(key) => setTab(key as ReportType)} />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-bone-soft p-4">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input w-auto"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input w-auto"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-bone-soft">
        {loading ? (
          <p className="p-6 text-center text-ink-faint">Loading report…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-ink-faint">No data for this range.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row, i) => (
              <li key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{row.label}</p>
                  {row.meta && <p className="text-xs text-ink-soft">{row.meta}</p>}
                </div>
                <span className="text-ink">{row.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
