"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/admin/AdminUI";
import { ImageUploader, type UploadedImage } from "@/components/admin/ImageUploader";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import type { PageSeo, SeoSettings } from "@/types";

/** The pages that get their own editable meta block. */
const MANAGED_PAGES = [
  { slug: "home", label: "Homepage", path: "/" },
  { slug: "about", label: "About", path: "/about" },
  { slug: "contact", label: "Contact", path: "/contact" },
  { slug: "faq", label: "FAQ", path: "/faq" },
  { slug: "shipping-policy", label: "Shipping policy", path: "/shipping-policy" },
  { slug: "returns-policy", label: "Returns policy", path: "/returns-policy" },
  { slug: "privacy-policy", label: "Privacy policy", path: "/privacy-policy" },
  { slug: "terms", label: "Terms of service", path: "/terms" },
];

export function SeoManager({
  seo: initial,
  pages: initialPages,
}: {
  seo: SeoSettings | null;
  pages: PageSeo[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState({
    meta_title_template: initial?.meta_title_template ?? "{page} | {site}",
    default_meta_description: initial?.default_meta_description ?? "",
    ga_tracking_id: initial?.ga_tracking_id ?? "",
    fb_pixel_id: initial?.fb_pixel_id ?? "",
    search_console_meta: initial?.search_console_meta ?? "",
    robots_txt:
      initial?.robots_txt ??
      "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /checkout",
  });

  const [ogImage, setOgImage] = useState<UploadedImage[]>(
    initial?.og_default_image_url
      ? [{ id: "og", url: initial.og_default_image_url }]
      : [],
  );

  // Keyed by slug so unsaved pages and saved ones are handled the same way.
  const [pages, setPages] = useState<Record<string, Partial<PageSeo>>>(() => {
    const map: Record<string, Partial<PageSeo>> = {};
    for (const page of MANAGED_PAGES) {
      const existing = initialPages.find((p) => p.page_slug === page.slug);
      map[page.slug] = existing ?? { page_slug: page.slug };
    }
    return map;
  });

  const [saving, setSaving] = useState(false);
  const [savingPage, setSavingPage] = useState<string | null>(null);

  async function saveGlobal() {
    setSaving(true);
    try {
      const payload = {
        meta_title_template: form.meta_title_template.trim() || "{page} | {site}",
        default_meta_description: form.default_meta_description.trim() || null,
        ga_tracking_id: form.ga_tracking_id.trim() || null,
        fb_pixel_id: form.fb_pixel_id.trim() || null,
        search_console_meta: form.search_console_meta.trim() || null,
        robots_txt: form.robots_txt.trim() || null,
        og_default_image_url: ogImage[0]?.url ?? null,
      };

      const { error } = initial
        ? await supabase.from("seo_settings").update(payload).eq("id", initial.id)
        : await supabase.from("seo_settings").insert(payload);

      if (error) {
        toast.error("Couldn't save SEO settings", error.message);
        return;
      }

      toast.success("SEO settings saved");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function savePage(slug: string) {
    setSavingPage(slug);
    try {
      const page = pages[slug];
      // Upsert on page_slug, which carries the unique constraint.
      const { error } = await supabase.from("page_seo").upsert(
        {
          page_slug: slug,
          meta_title: page.meta_title?.trim() || null,
          meta_description: page.meta_description?.trim() || null,
          og_image_url: page.og_image_url?.trim() || null,
        },
        { onConflict: "page_slug" },
      );

      if (error) {
        toast.error("Couldn't save this page", error.message);
        return;
      }
      toast.success("Page SEO saved");
    } finally {
      setSavingPage(null);
    }
  }

  const card = "card-surface p-6";

  return (
    <>
      <PageHeader
        title="SEO"
        description="Meta defaults, analytics tags, robots.txt and per-page overrides."
        action={
          <Button onClick={saveGlobal} loading={saving}>
            <Save className="h-4 w-4" aria-hidden />
            Save global SEO
          </Button>
        }
      />

      <div className="flex flex-col gap-6">
        <div className={card}>
          <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
            Global defaults
          </h2>
          <div className="flex flex-col gap-5">
            <Input
              label="Meta title template"
              value={form.meta_title_template}
              hint="Use {page} and {site} as placeholders — e.g. “{page} | {site}”."
              onChange={(e) =>
                setForm({ ...form, meta_title_template: e.target.value })
              }
            />
            <Textarea
              label="Default meta description"
              rows={3}
              maxLength={160}
              value={form.default_meta_description}
              hint={`${form.default_meta_description.length}/160`}
              onChange={(e) =>
                setForm({ ...form, default_meta_description: e.target.value })
              }
            />
            <ImageUploader
              bucket="brand-assets"
              images={ogImage}
              onChange={setOgImage}
              single
              label="Default Open Graph image (1200 × 630)"
            />
          </div>
        </div>

        <div className={card}>
          <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
            Tracking
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Google Analytics (GA4) ID"
              value={form.ga_tracking_id}
              placeholder="G-XXXXXXXXXX"
              hint="Injected into every page's head."
              onChange={(e) => setForm({ ...form, ga_tracking_id: e.target.value })}
            />
            <Input
              label="Facebook Pixel ID"
              value={form.fb_pixel_id}
              onChange={(e) => setForm({ ...form, fb_pixel_id: e.target.value })}
            />
            <Input
              label="Search Console verification"
              value={form.search_console_meta}
              hint="The content value of the google-site-verification tag."
              className="sm:col-span-2"
              onChange={(e) =>
                setForm({ ...form, search_console_meta: e.target.value })
              }
            />
          </div>
        </div>

        <div className={card}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-label uppercase tracking-[0.1em] text-ink">
              robots.txt
            </h2>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-caption normal-case tracking-normal text-accent underline underline-offset-4"
            >
              View live
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </div>

          <label htmlFor="robots" className="sr-only">
            robots.txt contents
          </label>
          <textarea
            id="robots"
            rows={8}
            value={form.robots_txt}
            onChange={(e) => setForm({ ...form, robots_txt: e.target.value })}
            className="w-full rounded-sm border border-ink/12 bg-white p-4 font-mono text-body-sm text-ink outline-none transition-colors focus:border-accent"
          />
          <p className="mt-3 text-caption normal-case tracking-normal text-muted">
            Served at /robots.txt. The sitemap line is appended automatically.
          </p>
        </div>

        <div className={card}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-label uppercase tracking-[0.1em] text-ink">
              Per-page SEO
            </h2>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-caption normal-case tracking-normal text-accent underline underline-offset-4"
            >
              View sitemap
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </div>

          <div className="flex flex-col gap-6">
            {MANAGED_PAGES.map((page) => {
              const value = pages[page.slug] ?? {};
              return (
                <div key={page.slug} className="rounded-sm border border-hairline p-5">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-body-sm font-medium text-ink">{page.label}</h3>
                      <span className="text-caption normal-case tracking-normal text-muted">
                        {page.path}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={savingPage === page.slug}
                      onClick={() => savePage(page.slug)}
                    >
                      Save
                    </Button>
                  </div>

                  <div className="flex flex-col gap-4">
                    <Input
                      label="Meta title"
                      maxLength={70}
                      value={value.meta_title ?? ""}
                      onChange={(e) =>
                        setPages({
                          ...pages,
                          [page.slug]: { ...value, meta_title: e.target.value },
                        })
                      }
                    />
                    <Textarea
                      label="Meta description"
                      rows={2}
                      maxLength={160}
                      value={value.meta_description ?? ""}
                      onChange={(e) =>
                        setPages({
                          ...pages,
                          [page.slug]: { ...value, meta_description: e.target.value },
                        })
                      }
                    />
                    <Input
                      label="OG image URL"
                      value={value.og_image_url ?? ""}
                      hint="Falls back to the global default."
                      onChange={(e) =>
                        setPages({
                          ...pages,
                          [page.slug]: { ...value, og_image_url: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={saveGlobal} loading={saving}>
          <Save className="h-4 w-4" aria-hidden />
          Save global SEO
        </Button>
      </div>
    </>
  );
}
