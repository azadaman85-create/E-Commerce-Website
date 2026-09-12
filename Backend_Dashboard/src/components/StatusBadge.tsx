export type StatusTone = 'active' | 'warning' | 'inactive' | 'neutral'

const TONE_CLASSES: Record<StatusTone, string> = {
  active: 'bg-sage-soft text-sage',
  warning: 'bg-ochre-soft text-ochre',
  inactive: 'bg-rust-soft text-rust',
  neutral: 'bg-bone-deep text-ink-soft',
}

interface StatusBadgeProps {
  label: string
  tone: StatusTone
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
