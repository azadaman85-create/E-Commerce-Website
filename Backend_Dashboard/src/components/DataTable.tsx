import type { ReactNode } from 'react'

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowId: (row: T) => string
  emptyMessage?: string
  isLoading?: boolean
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  emptyMessage = 'Nothing to show yet.',
  isLoading = false,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-bone-soft">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 font-medium text-ink-soft"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-ink-faint">
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-ink-faint">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowId(row)}
                className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-bone-deep/50"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-ink ${col.className ?? ''}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
