import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { listCustomers } from '../../services/customers'
import type { Customer } from '../../types'
import { formatCurrency, formatDate } from '../../lib/format'

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    listCustomers(search || undefined).then((result) => {
      setCustomers(result)
      setLoading(false)
    })
  }, [search])

  const columns: DataTableColumn<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (c) => (
        <div>
          <p className="font-medium text-ink">{c.name}</p>
          <p className="text-xs text-ink-soft">{c.email}</p>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (c) => c.phone },
    { key: 'joined', header: 'Joined', render: (c) => formatDate(c.joinedAt) },
    { key: 'orders', header: 'Orders', render: (c) => c.totalOrders },
    { key: 'spent', header: 'Total spent', render: (c) => formatCurrency(c.totalSpent) },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <StatusBadge
          label={c.status === 'active' ? 'Active' : 'Inactive'}
          tone={c.status === 'active' ? 'active' : 'inactive'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <Link
          to={`/customers/${c.id}`}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-bone-deep"
        >
          View
        </Link>
      ),
      className: 'text-right',
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl text-ink">Customers</h1>
        <p className="mt-1 text-sm text-ink-soft">{customers.length} customers</p>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email…"
        className="input max-w-sm"
      />

      <DataTable columns={columns} rows={customers} getRowId={(c) => c.id} isLoading={loading} />
    </div>
  )
}
