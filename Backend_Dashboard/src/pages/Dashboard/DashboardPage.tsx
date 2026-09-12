import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { StatCard } from '../../components/StatCard'
import { StatusBadge, type StatusTone } from '../../components/StatusBadge'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { useCountUp } from '../../hooks/useCountUp'
import {
  getAlerts,
  getKpiSummary,
  getOrderStatusBreakdown,
  getRecentOrders,
  getSalesSeries,
  getTopProducts,
  type DashboardAlert,
  type KpiSummary,
  type OrderStatusSlice,
  type SalesPoint,
  type SalesRange,
  type TopProduct,
} from '../../services/dashboard'
import { ORDER_STATUS_LABELS } from '../../services/orders'
import type { Order, OrderStatus } from '../../types'
import { formatCurrency, formatDate } from '../../lib/format'

const RANGE_OPTIONS: { key: SalesRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '12mo', label: '12 months' },
]

const STATUS_TONE: Record<OrderStatus, StatusTone> = {
  new: 'neutral',
  confirmed: 'neutral',
  packing: 'warning',
  ready: 'warning',
  shipped: 'active',
  out_for_delivery: 'active',
  delivered: 'active',
  cancelled: 'inactive',
  returned: 'inactive',
  refunded: 'inactive',
}

const DONUT_COLORS = [
  'var(--color-accent)',
  'var(--color-sage)',
  'var(--color-ochre)',
  'var(--color-rust)',
  '#c9a97a',
  '#8a97a8',
  '#b58fa6',
  '#7a9e8e',
  '#a88f6b',
  '#9a7d8f',
]

const ALERT_TONE: Record<DashboardAlert['tone'], StatusTone> = {
  danger: 'inactive',
  warning: 'warning',
  info: 'neutral',
}

function pseudoTrend(seed: number, points = 8): number[] {
  const base = Math.max(seed, 1)
  return Array.from({ length: points }, (_, i) =>
    Math.max(0, Math.round(base * (0.65 + 0.35 * Math.sin(i * 1.3 + seed))))
  )
}

export function DashboardPage() {
  const [kpis, setKpis] = useState<KpiSummary | null>(null)
  const [range, setRange] = useState<SalesRange>('7d')
  const [sales, setSales] = useState<SalesPoint[]>([])
  const [statusBreakdown, setStatusBreakdown] = useState<OrderStatusSlice[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [alerts, setAlerts] = useState<DashboardAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getKpiSummary(),
      getOrderStatusBreakdown(),
      getTopProducts(),
      getRecentOrders(),
      getAlerts(),
    ]).then(([k, s, t, r, a]) => {
      if (cancelled) return
      setKpis(k)
      setStatusBreakdown(s)
      setTopProducts(t)
      setRecentOrders(r)
      setAlerts(a)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    getSalesSeries(range).then(setSales)
  }, [range])

  const heroRevenue = useCountUp(kpis?.revenueTotal ?? 0, 1200)
  const totalOrdersInBreakdown = useMemo(
    () => statusBreakdown.reduce((sum, s) => sum + s.count, 0),
    [statusBreakdown],
  )

  const orderColumns: DataTableColumn<Order>[] = [
    { key: 'orderNumber', header: 'Order', render: (o) => <span className="font-medium">{o.orderNumber}</span> },
    { key: 'customer', header: 'Customer', render: (o) => o.customerName },
    {
      key: 'product',
      header: 'Product',
      render: (o) => `${o.items[0]?.productName ?? '—'}${o.items.length > 1 ? ` +${o.items.length - 1}` : ''}`,
    },
    { key: 'amount', header: 'Amount', render: (o) => formatCurrency(o.total) },
    {
      key: 'status',
      header: 'Status',
      render: (o) => <StatusBadge label={ORDER_STATUS_LABELS[o.status]} tone={STATUS_TONE[o.status]} />,
    },
    { key: 'date', header: 'Date', render: (o) => formatDate(o.createdAt) },
  ]

  return (
    <div
      className="-m-5 flex flex-col gap-6 p-5 md:-m-8 md:p-8"
      style={{
        backgroundImage: [
          'radial-gradient(rgba(168, 159, 143, 0.35) 1px, transparent 1px)',
          'radial-gradient(circle at 8% 0%, rgba(107, 39, 55, 0.09), transparent 32%)',
          'radial-gradient(circle at 100% 22%, rgba(124, 139, 111, 0.11), transparent 32%)',
          'radial-gradient(circle at 20% 100%, rgba(184, 135, 61, 0.09), transparent 32%)',
        ].join(', '),
        backgroundSize: '28px 28px, auto, auto, auto',
      }}
    >
      <div>
        <h1 className="font-display text-3xl text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-soft">
          A quick read on today's store performance.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6b2737] via-[#5a2130] to-[#3f1721] p-6 text-bone-soft shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-bone-soft/70">
              Lifetime revenue
            </p>
            <p className="mt-2 font-display text-5xl tabular-nums sm:text-6xl">
              {formatCurrency(heroRevenue)}
            </p>
            <p className="mt-2 text-sm text-bone-soft/80">
              Across {kpis ? Object.values(kpis.ordersByStatus).reduce((a, b) => a + b, 0) : 0}{' '}
              orders since launch
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {[
              { label: 'Today', value: kpis?.revenueToday ?? 0 },
              { label: 'This week', value: kpis?.revenueWeek ?? 0 },
              { label: 'This month', value: kpis?.revenueMonth ?? 0 },
            ].map((item) => (
              <div key={item.label} className="text-right">
                <p className="text-xs text-bone-soft/70">{item.label}</p>
                <p className="mt-1 font-display text-xl sm:text-2xl">
                  {formatCurrency(item.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue today"
          value={kpis?.revenueToday ?? 0}
          format={formatCurrency}
          delta={{ value: '4.2%', direction: 'up' }}
          icon="◈"
          trend={kpis ? pseudoTrend(kpis.revenueToday || 1, 8) : undefined}
        />
        <StatCard
          label="Orders today"
          value={kpis?.ordersByStatus.new ?? 0}
          delta={{ value: '2.1%', direction: 'up' }}
          icon="▤"
          trend={kpis ? pseudoTrend((kpis.ordersByStatus.new || 1) * 10, 8) : undefined}
        />
        <StatCard
          label="Low stock items"
          value={kpis?.productsLowStock ?? 0}
          delta={{ value: '1.4%', direction: 'down' }}
          icon="⬚"
          trend={kpis ? pseudoTrend((kpis.productsLowStock || 1) * 6, 8) : undefined}
        />
        <StatCard
          label="Total customers"
          value={kpis?.totalCustomers ?? 0}
          delta={{ value: `${kpis?.newCustomersThisMonth ?? 0} new`, direction: 'up' }}
          icon="◐"
          trend={kpis ? pseudoTrend((kpis.totalCustomers || 1) * 3, 8) : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-bone-soft p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg text-ink">Sales over time</h2>
            <div className="flex gap-1 rounded-full border border-border p-1">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setRange(opt.key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    range === opt.key ? 'bg-accent text-bone-soft' : 'text-ink-soft hover:bg-bone-deep'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--color-ink-soft)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--color-ink-soft)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    background: 'var(--color-bone-soft)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-accent)"
                  strokeWidth={2.5}
                  fill="url(#salesFill)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-bone-soft p-5 shadow-sm">
          <h2 className="text-lg text-ink">Order status</h2>
          <div className="relative mt-2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  cornerRadius={4}
                >
                  {statusBreakdown.map((slice, i) => (
                    <Cell key={slice.status} fill={DONUT_COLORS[i % DONUT_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, entry) => [
                    value,
                    ORDER_STATUS_LABELS[
                      (entry.payload as OrderStatusSlice).status as OrderStatus
                    ],
                  ]}
                  contentStyle={{
                    background: 'var(--color-bone-soft)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl text-ink">{totalOrdersInBreakdown}</span>
              <span className="text-xs text-ink-soft">orders</span>
            </div>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-soft">
            {statusBreakdown.map((slice, i) => (
              <li key={slice.status} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                />
                {ORDER_STATUS_LABELS[slice.status]} ({slice.count})
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-bone-soft p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg text-ink">Recent orders</h2>
          <div className="mt-3">
            <DataTable
              columns={orderColumns}
              rows={recentOrders}
              getRowId={(o) => o.id}
              isLoading={loading}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-bone-soft p-5 shadow-sm">
            <h2 className="text-lg text-ink">Top selling products</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {topProducts.map((p, i) => (
                <li
                  key={p.productId}
                  className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-bone-deep/50"
                >
                  <span className="w-4 text-xs text-ink-faint">{i + 1}</span>
                  <img src={p.image} alt="" className="h-10 w-8 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-ink">{p.name}</p>
                    <p className="text-xs text-ink-soft">{p.unitsSold} sold</p>
                  </div>
                  <span className="text-sm font-medium text-ink">{formatCurrency(p.revenue)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-bone-soft p-5 shadow-sm">
            <h2 className="text-lg text-ink">Alerts</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <StatusBadge label={alert.message} tone={ALERT_TONE[alert.tone]} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
