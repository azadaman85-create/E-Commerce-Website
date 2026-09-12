interface ProgressBarProps {
  current: number
  threshold: number
  max?: number
}

export function ProgressBar({ current, threshold, max }: ProgressBarProps) {
  const ceiling = max ?? Math.max(threshold * 3, current, 1)
  const pct = Math.min(100, Math.round((current / ceiling) * 100))

  const tone =
    current <= 0 ? 'bg-rust' : current <= threshold ? 'bg-ochre' : 'bg-sage'

  return (
    <div className="flex w-32 items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bone-deep">
        <div
          className={`h-full rounded-full transition-all ${tone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-14 shrink-0 text-xs text-ink-soft">
        {current}/{threshold}
      </span>
    </div>
  )
}
