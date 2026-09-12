interface TabsProps {
  tabs: { key: string; label: string; count?: number }[]
  active: string
  onChange: (key: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            active === tab.key
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-soft hover:text-ink'
          }`}
        >
          {tab.label}
          {tab.count != null && (
            <span className="ml-1.5 text-xs text-ink-faint">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
