import { useEffect, useState } from 'react'
import { Modal } from '../../components/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../hooks/useToast'
import { createBrand, deleteBrand, listBrands } from '../../services/brands'
import type { Brand } from '../../types'

export function BrandsPage() {
  const { showToast } = useToast()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null)

  const refresh = () => {
    setLoading(true)
    listBrands().then((result) => {
      setBrands(result)
      setLoading(false)
    })
  }

  useEffect(refresh, [])

  const submit = async () => {
    if (!name.trim()) {
      showToast('Enter a brand name.', 'error')
      return
    }
    await createBrand(name.trim())
    showToast('Brand added', 'success')
    setModalOpen(false)
    setName('')
    refresh()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteBrand(deleteTarget.id)
    showToast('Brand deleted', 'success')
    setDeleteTarget(null)
    refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Brands</h1>
          <p className="mt-1 text-sm text-ink-soft">Brand labels available when creating a product.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover"
        >
          + Add brand
        </button>
      </div>

      {loading ? (
        <p className="text-ink-soft">Loading brands…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-bone-soft p-4"
            >
              <div>
                <p className="font-medium text-ink">{brand.name}</p>
                <p className="text-xs text-ink-soft">
                  {brand.productCount} product{brand.productCount === 1 ? '' : 's'}
                </p>
              </div>
              <button
                onClick={() => setDeleteTarget(brand)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-rust transition-colors hover:bg-rust-soft"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add brand"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bone-deep"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover"
            >
              Save
            </button>
          </>
        }
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Brand name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" autoFocus />
        </label>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete brand?"
        message={`This will remove “${deleteTarget?.name}” from the brand list.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
