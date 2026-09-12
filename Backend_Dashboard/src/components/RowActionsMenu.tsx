import { useEffect, useRef, useState } from 'react'

export interface RowAction {
  label: string
  onClick: () => void
  tone?: 'default' | 'danger'
}

interface RowActionsMenuProps {
  actions: RowAction[]
}

export function RowActionsMenu({ actions }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickAway = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        aria-label="Row actions"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-bone-deep hover:text-ink"
      >
        ⋯
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-bone-soft py-1 shadow-lg">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                action.onClick()
                setOpen(false)
              }}
              className={`block w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-bone-deep ${
                action.tone === 'danger' ? 'text-rust' : 'text-ink'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
