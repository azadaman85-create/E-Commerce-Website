import { useEffect, useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { getPageContent, updatePageContent } from '../../services/content'
import { listProducts } from '../../services/products'
import type { PageContent, Product } from '../../types'

export function ContentPage() {
  const { showToast } = useToast()
  const [content, setContent] = useState<PageContent | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPageContent(), listProducts()]).then(([c, p]) => {
      setContent(c)
      setProducts(p)
      setLoading(false)
    })
  }, [])

  if (loading || !content) return <p className="text-ink-soft">Loading content…</p>

  const saveHero = async () => {
    await updatePageContent({ hero: content.hero })
    showToast('Hero section saved', 'success')
  }

  const saveAnnouncement = async () => {
    await updatePageContent({ announcement: content.announcement })
    showToast('Announcement bar saved', 'success')
  }

  const toggleFeatured = async (id: string) => {
    const next = content.featuredProductIds.includes(id)
      ? content.featuredProductIds.filter((p) => p !== id)
      : [...content.featuredProductIds, id]
    const updated = { ...content, featuredProductIds: next }
    setContent(updated)
    await updatePageContent({ featuredProductIds: next })
    showToast('Featured products updated', 'success')
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <h1 className="font-display text-3xl text-ink">Content</h1>
        <p className="mt-1 text-sm text-ink-soft">Manage the storefront's homepage content.</p>
      </div>

      <section className="rounded-2xl border border-border bg-bone-soft p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg text-ink">Hero section</h2>
          <button
            onClick={saveHero}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover"
          >
            Save
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Headline</span>
              <input
                value={content.hero.headline}
                onChange={(e) =>
                  setContent({ ...content, hero: { ...content.hero, headline: e.target.value } })
                }
                className="input"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Subheadline</span>
              <input
                value={content.hero.subheadline}
                onChange={(e) =>
                  setContent({ ...content, hero: { ...content.hero, subheadline: e.target.value } })
                }
                className="input"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">CTA label</span>
                <input
                  value={content.hero.ctaLabel}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, ctaLabel: e.target.value } })
                  }
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">CTA URL</span>
                <input
                  value={content.hero.ctaUrl}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, ctaUrl: e.target.value } })
                  }
                  className="input"
                />
              </label>
            </div>
          </div>
          <img src={content.hero.image} alt="" className="h-full max-h-56 w-full rounded-xl object-cover" />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-bone-soft p-5">
        <h2 className="mb-4 text-lg text-ink">Promo banners</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {content.banners.map((banner) => (
            <div key={banner.id} className="overflow-hidden rounded-xl border border-border">
              <img src={banner.bannerImage} alt="" className="h-28 w-full object-cover" />
              <div className="p-3">
                <p className="text-sm font-medium text-ink">{banner.title}</p>
                <p className="text-xs text-ink-soft">{banner.linkUrl}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-faint">Manage banners from the Marketing → Promotions tab.</p>
      </section>

      <section className="rounded-2xl border border-border bg-bone-soft p-5">
        <h2 className="mb-4 text-lg text-ink">Featured products</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => {
            const active = content.featuredProductIds.includes(p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggleFeatured(p.id)}
                className={`overflow-hidden rounded-xl border text-left transition-colors ${
                  active ? 'border-accent ring-1 ring-accent' : 'border-border'
                }`}
              >
                <img src={p.images[0]} alt="" className="h-32 w-full object-cover" />
                <div className="flex items-center justify-between p-2">
                  <span className="truncate text-xs text-ink">{p.name}</span>
                  {active && <span className="text-accent">✓</span>}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-bone-soft p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg text-ink">Announcement bar</h2>
          <button
            onClick={saveAnnouncement}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover"
          >
            Save
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={content.announcement.enabled}
              onChange={(e) =>
                setContent({
                  ...content,
                  announcement: { ...content.announcement, enabled: e.target.checked },
                })
              }
              className="h-4 w-4 rounded border-border accent-accent"
            />
            <span className="font-medium text-ink">Show announcement bar</span>
          </label>
          <input
            value={content.announcement.text}
            onChange={(e) =>
              setContent({
                ...content,
                announcement: { ...content.announcement, text: e.target.value },
              })
            }
            className="input"
          />
        </div>
      </section>
    </div>
  )
}
