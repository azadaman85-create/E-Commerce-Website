export function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
