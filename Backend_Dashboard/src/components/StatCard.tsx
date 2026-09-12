import { useCountUp } from '../hooks/useCountUp'
import { Sparkline } from './Sparkline'

interface StatCardProps {
  label: string
  value: number
  format?: (n: number) => string
  delta?: {
    value: string
    direction: 'up' | 'down'
  }
  icon?: string
  trend?: number[]
}

export function StatCard({ label, value, format, delta, icon, trend }: StatCardProps) {
  const animated = useCountUp(value)
  const display = format ? format(animated) : String(animated)

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-bone-soft p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/5">
      <div
        className="pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'var(--color-accent)' }}
      />

      <div className="relative flex items-start justify-between">
        <span className="text-sm font-medium text-ink-soft">{label}</span>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-hover text-sm text-bone-soft shadow-sm">
            {icon}
          </span>
        )}
      </div>

      <div className="relative mt-3 flex items-end justify-between">
        <span className="font-display text-3xl tabular-nums text-ink">{display}</span>
        {delta && (
          <span
            className={`text-xs font-medium ${
              delta.direction === 'up' ? 'text-sage' : 'text-rust'
            }`}
          >
            {delta.direction === 'up' ? '▲' : '▼'} {delta.value}
          </span>
        )}
      </div>

      {trend && (
        <div className="relative mt-3">
          <Sparkline data={trend} />
        </div>
      )}
    </div>
  )
}
