import { useEffect, useState } from 'react'
import { Modal } from '../../components/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../hooks/useToast'
import { createCategory, deleteCategory, listCategories } from '../../services/categories'
import type { Category } from '../../types'

export function CategoriesPage() {
  const { showToast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const refresh = () => {
    setLoading(true)
    listCategories().then((result) => {
      setCategories(result)
      setLoading(false)
    })
  }

  useEffect(refresh, [])

  const topLevel = categories.filter((c) => !c.parentId)
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id)

  const openModal = (preselectParent?: string) => {
    setName('')
    setParentId(preselectParent ?? '')
    setModalOpen(true)
  }

  const submit = async () => {
    if (!name.trim()) {
      showToast('Enter a category name.', 'error')
      return
    }
    await createCategory(name.trim(), parentId || undefined)
    showToast(parentId ? 'Subcategory added' : 'Category added', 'success')
    setModalOpen(false)
    refresh()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteCategory(deleteTarget.id)
    showToast('Category deleted', 'success')
    setDeleteTarget(null)
    refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Categories</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Organize the catalogue into categories and subcategories.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover"
        >
          + Add category
        </button>
      </div>

      {loading ? (
        <p className="text-ink-soft">Loading categories…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {topLevel.map((category) => (
            <div key={category.id} className="rounded-2xl border border-border bg-bone-soft p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">{category.name}</p>
                  <p className="text-xs text-ink-soft">
                    {category.productCount} product{category.productCount === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openModal(category.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-bone-deep hover:text-ink"
                  >
                    + Subcategory
                  </button>
                  <button
                    onClick={() => setDeleteTarget(category)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-rust transition-colors hover:bg-rust-soft"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {childrenOf(category.id).length > 0 && (
                <ul className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                  {childrenOf(category.id).map((child) => (
                    <li key={child.id} className="flex items-center justify-between pl-4 text-sm">
                      <span className="text-ink-soft">— {child.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-ink-faint">
                          {child.productCount} product{child.productCount === 1 ? '' : 's'}
                        </span>
                        <button
                          onClick={() => setDeleteTarget(child)}
                          className="rounded-lg px-2 py-1 text-xs text-rust transition-colors hover:bg-rust-soft"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={parentId ? 'Add subcategory' : 'Add category'}
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
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" autoFocus />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Parent category</span>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="input">
              <option value="">None — top-level category</option>
              {topLevel.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete category?"
        message={`This will remove “${deleteTarget?.name}”. Any subcategories underneath will become top-level categories.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
