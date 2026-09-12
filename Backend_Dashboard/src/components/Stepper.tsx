interface StepperProps {
  steps: { key: string; label: string }[]
  currentIndex: number
  isBranched?: boolean
  branchLabel?: string
}

export function Stepper({ steps, currentIndex, isBranched, branchLabel }: StepperProps) {
  if (isBranched && branchLabel) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-rust/40 bg-rust-soft px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rust text-sm text-bone-soft">
          ✕
        </span>
        <span className="text-sm font-medium text-ink">{branchLabel}</span>
      </div>
    )
  }

  return (
    <div className="flex w-full items-start overflow-x-auto">
      {steps.map((step, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        return (
          <div key={step.key} className="flex flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors ${
                  done
                    ? 'border-sage bg-sage text-bone-soft'
                    : active
                      ? 'border-accent bg-accent text-bone-soft'
                      : 'border-border bg-bone-soft text-ink-faint'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-px flex-1 ${done ? 'bg-sage' : 'bg-border'}`}
                />
              )}
            </div>
            <span
              className={`mt-2 max-w-[5.5rem] text-center text-xs ${
                active ? 'font-medium text-ink' : 'text-ink-soft'
              }`}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
