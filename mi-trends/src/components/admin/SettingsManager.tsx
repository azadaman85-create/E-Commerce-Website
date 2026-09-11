"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader } from "@/components/admin/AdminUI";
import { ImageUploader, type UploadedImage } from "@/components/admin/ImageUploader";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { HeroSlide, ShippingMethod, SiteSettings } from "@/types";

const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
];

type Tab = "brand" | "contact" | "commerce" | "hero";

const TABS: { id: Tab; label: string }[] = [
  { id: "brand", label: "Brand" },
  { id: "contact", label: "Contact & social" },
  { id: "commerce", label: "Currency, tax & shipping" },
  { id: "hero", label: "Homepage" },
];

export function SettingsManager({
  settings: initial,
  shippingMethods: initialMethods,
  heroSlides: initialSlides,
}: {
  settings: SiteSettings | null;
  shippingMethods: ShippingMethod[];
  heroSlides: HeroSlide[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("brand");
  const [form, setForm] = useState(() => ({
    site_name: initial?.site_name ?? "MI TRENDS",
    tagline: initial?.tagline ?? "",
    contact_email: initial?.contact_email ?? "",
    contact_phone: initial?.contact_phone ?? "",
    business_address: initial?.business_address ?? "",
    currency_code: initial?.currency_code ?? "INR",
    currency_symbol: initial?.currency_symbol ?? "₹",
    tax_rate: String(initial?.tax_rate ?? 18),
    tax_inclusive: initial?.tax_inclusive ?? false,
    announcement_bar_active: initial?.announcement_bar_active ?? false,
    announcement_bar_text: initial?.announcement_bar_text ?? "",
    announcement_bar_link: initial?.announcement_bar_link ?? "",
    announcement_bar_color: initial?.announcement_bar_color ?? "#1A1A1A",
    social_instagram: initial?.social_instagram ?? "",
    social_facebook: initial?.social_facebook ?? "",
    social_twitter: initial?.social_twitter ?? "",
    social_tiktok: initial?.social_tiktok ?? "",
    social_youtube: initial?.social_youtube ?? "",
    sale_active: initial?.sale_active ?? false,
    sale_headline: initial?.sale_headline ?? "",
    sale_ends_at: initial?.sale_ends_at?.slice(0, 10) ?? "",
  }));

  const [logo, setLogo] = useState<UploadedImage[]>(
    initial?.logo_url ? [{ id: "logo", url: initial.logo_url }] : [],
  );
  const [logoInverted, setLogoInverted] = useState<UploadedImage[]>(
    initial?.logo_inverted_url ? [{ id: "logo-inv", url: initial.logo_inverted_url }] : [],
  );
  const [favicon, setFavicon] = useState<UploadedImage[]>(
    initial?.favicon_url ? [{ id: "favicon", url: initial.favicon_url }] : [],
  );

  const [methods, setMethods] = useState(initialMethods);
  const [slides, setSlides] = useState(initialSlides);
  const [saving, setSaving] = useState(false);
  const [deletingMethod, setDeletingMethod] = useState<ShippingMethod | null>(null);
  const [deletingSlide, setDeletingSlide] = useState<HeroSlide | null>(null);

  async function saveSettings() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        tagline: form.tagline || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        business_address: form.business_address || null,
        announcement_bar_text: form.announcement_bar_text || null,
        announcement_bar_link: form.announcement_bar_link || null,
        social_instagram: form.social_instagram || null,
        social_facebook: form.social_facebook || null,
        social_twitter: form.social_twitter || null,
        social_tiktok: form.social_tiktok || null,
        social_youtube: form.social_youtube || null,
        sale_headline: form.sale_headline || null,
        sale_ends_at: form.sale_ends_at ? new Date(form.sale_ends_at).toISOString() : null,
        tax_rate: Number(form.tax_rate) || 0,
        logo_url: logo[0]?.url ?? null,
        logo_inverted_url: logoInverted[0]?.url ?? null,
        favicon_url: favicon[0]?.url ?? null,
      };

      // There is exactly one settings row; create it if this is a fresh install.
      const { error } = initial
        ? await supabase.from("site_settings").update(payload).eq("id", initial.id)
        : await supabase.from("site_settings").insert(payload);

      if (error) {
        toast.error("Couldn't save settings", error.message);
        return;
      }

      toast.success("Settings saved", "The storefront updates on the next page load.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function addShippingMethod() {
    const { data, error } = await supabase
      .from("shipping_methods")
      .insert({
        name: "New method",
        price: 0,
        estimated_delivery: "3–5 business days",
        sort_order: methods.length,
      })
      .select()
      .single();

    if (error) {
      toast.error("Couldn't add the method", error.message);
      return;
    }
    setMethods([...methods, data as ShippingMethod]);
  }

  async function saveShippingMethod(method: ShippingMethod) {
    const { error } = await supabase
      .from("shipping_methods")
      .update({
        name: method.name,
        price: Number(method.price) || 0,
        estimated_delivery: method.estimated_delivery,
        free_shipping_threshold:
          method.free_shipping_threshold === null ||
          String(method.free_shipping_threshold) === ""
            ? null
            : Number(method.free_shipping_threshold),
        is_active: method.is_active,
      })
      .eq("id", method.id);

    if (error) {
      toast.error("Couldn't save the method", error.message);
      return;
    }
    toast.success("Shipping method saved");
  }

  async function deleteShippingMethod() {
    if (!deletingMethod) return;
    const { error } = await supabase
      .from("shipping_methods")
      .delete()
      .eq("id", deletingMethod.id);

    if (error) {
      toast.error("Couldn't delete", error.message);
      return;
    }
    setMethods((prev) => prev.filter((m) => m.id !== deletingMethod.id));
    setDeletingMethod(null);
    toast.success("Shipping method deleted");
  }

  async function addSlide() {
    const { data, error } = await supabase
      .from("hero_slides")
      .insert({
        image_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=2000&q=80",
        heading: "New slide",
        sort_order: slides.length,
      })
      .select()
      .single();

    if (error) {
      toast.error("Couldn't add the slide", error.message);
      return;
    }
    setSlides([...slides, data as HeroSlide]);
  }

  async function saveSlide(slide: HeroSlide) {
    const { error } = await supabase
      .from("hero_slides")
      .update({
        image_url: slide.image_url,
        heading: slide.heading,
        subheading: slide.subheading,
        cta_text: slide.cta_text,
        cta_link: slide.cta_link,
        is_active: slide.is_active,
        sort_order: slide.sort_order,
      })
      .eq("id", slide.id);

    if (error) {
      toast.error("Couldn't save the slide", error.message);
      return;
    }
    toast.success("Slide saved");
  }

  async function deleteSlide() {
    if (!deletingSlide) return;
    const { error } = await supabase
      .from("hero_slides")
      .delete()
      .eq("id", deletingSlide.id);

    if (error) {
      toast.error("Couldn't delete", error.message);
      return;
    }
    setSlides((prev) => prev.filter((s) => s.id !== deletingSlide.id));
    setDeletingSlide(null);
    toast.success("Slide deleted");
  }

  /** Moves a slide up or down and persists both new positions. */
  async function moveSlide(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;

    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    const reindexed = next.map((s, i) => ({ ...s, sort_order: i }));
    setSlides(reindexed);

    for (const slide of reindexed) {
      await supabase
        .from("hero_slides")
        .update({ sort_order: slide.sort_order })
        .eq("id", slide.id);
    }
  }

  const card = "card-surface p-6";
  const grid = "grid gap-5 sm:grid-cols-2";

  return (
    <>
      <PageHeader
        title="Settings"
        description="Brand, contact details, commerce rules and homepage content."
        action={
          <Button onClick={saveSettings} loading={saving}>
            <Save className="h-4 w-4" aria-hidden />
            Save settings
          </Button>
        }
      />

      <div
        className="mb-8 flex gap-1 overflow-x-auto rounded-sm bg-white p-1 shadow-card"
        role="tablist"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 cursor-pointer rounded-sm px-5 py-2.5 text-caption uppercase tracking-[0.1em] transition-colors",
              tab === t.id ? "bg-ink text-white" : "text-muted hover:bg-ink/5 hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "brand" && (
        <div className="flex flex-col gap-6">
          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Identity
            </h2>
            <div className="flex flex-col gap-5">
              <Input
                label="Site name"
                required
                value={form.site_name}
                hint="Appears in the header, title tag and emails."
                onChange={(e) => setForm({ ...form, site_name: e.target.value })}
              />
              <Input
                label="Tagline"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Logos
            </h2>
            <div className="grid gap-8 lg:grid-cols-3">
              <ImageUploader
                bucket="brand-assets"
                images={logo}
                onChange={setLogo}
                single
                label="Primary logo (light background)"
              />
              <ImageUploader
                bucket="brand-assets"
                images={logoInverted}
                onChange={setLogoInverted}
                single
                label="Inverted logo (dark footer)"
              />
              <ImageUploader
                bucket="brand-assets"
                images={favicon}
                onChange={setFavicon}
                single
                label="Favicon"
              />
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Announcement bar
            </h2>
            <div className="flex flex-col gap-5">
              <Checkbox
                label="Show the announcement bar above the header"
                checked={form.announcement_bar_active}
                onChange={(e) =>
                  setForm({ ...form, announcement_bar_active: e.target.checked })
                }
              />
              <Input
                label="Text"
                value={form.announcement_bar_text}
                onChange={(e) =>
                  setForm({ ...form, announcement_bar_text: e.target.value })
                }
              />
              <div className={grid}>
                <Input
                  label="Link URL"
                  value={form.announcement_bar_link}
                  hint="Optional — leave blank for plain text."
                  onChange={(e) =>
                    setForm({ ...form, announcement_bar_link: e.target.value })
                  }
                />
                <div>
                  <label
                    htmlFor="bar-colour"
                    className="text-caption uppercase tracking-[0.1em] text-muted"
                  >
                    Background colour
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      id="bar-colour"
                      type="color"
                      value={form.announcement_bar_color}
                      onChange={(e) =>
                        setForm({ ...form, announcement_bar_color: e.target.value })
                      }
                      className="h-12 w-16 cursor-pointer rounded-sm border border-ink/12"
                    />
                    <span className="text-body-sm tabular-nums text-muted">
                      {form.announcement_bar_color}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "contact" && (
        <div className="flex flex-col gap-6">
          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Contact details
            </h2>
            <div className="flex flex-col gap-5">
              <div className={grid}>
                <Input
                  label="Business email"
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                />
              </div>
              <Textarea
                label="Business address"
                rows={3}
                value={form.business_address}
                onChange={(e) => setForm({ ...form, business_address: e.target.value })}
              />
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Social links
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {([
                ["social_instagram", "Instagram"],
                ["social_facebook", "Facebook"],
                ["social_twitter", "X / Twitter"],
                ["social_tiktok", "TikTok"],
                ["social_youtube", "YouTube"],
              ] as const).map(([key, label]) => (
                <Input
                  key={key}
                  label={label}
                  value={form[key]}
                  placeholder="https://"
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "commerce" && (
        <div className="flex flex-col gap-6">
          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Currency &amp; tax
            </h2>
            <div className="flex flex-col gap-5">
              <div className={grid}>
                <Select
                  label="Currency"
                  value={form.currency_code}
                  onChange={(e) => {
                    const currency = CURRENCIES.find((c) => c.code === e.target.value);
                    setForm({
                      ...form,
                      currency_code: e.target.value,
                      currency_symbol: currency?.symbol ?? form.currency_symbol,
                    });
                  }}
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.label} ({currency.code})
                    </option>
                  ))}
                </Select>
                <Input
                  label="Currency symbol"
                  value={form.currency_symbol}
                  onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })}
                />
              </div>

              <div className={grid}>
                <Input
                  label="Tax rate (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.tax_rate}
                  onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                />
                <div className="flex items-end pb-4">
                  <Checkbox
                    label="Prices already include tax"
                    checked={form.tax_inclusive}
                    onChange={(e) =>
                      setForm({ ...form, tax_inclusive: e.target.checked })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Sale banner
            </h2>
            <div className="flex flex-col gap-5">
              <Checkbox
                label="Show the promotional countdown banner on the homepage"
                checked={form.sale_active}
                onChange={(e) => setForm({ ...form, sale_active: e.target.checked })}
              />
              <div className={grid}>
                <Input
                  label="Headline"
                  value={form.sale_headline}
                  onChange={(e) => setForm({ ...form, sale_headline: e.target.value })}
                />
                <Input
                  label="Sale ends"
                  type="date"
                  value={form.sale_ends_at}
                  hint="The countdown hides itself once this passes."
                  onChange={(e) => setForm({ ...form, sale_ends_at: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className={card}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-label uppercase tracking-[0.1em] text-ink">
                Shipping methods
              </h2>
              <Button size="sm" variant="secondary" onClick={addShippingMethod}>
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add method
              </Button>
            </div>

            {methods.length === 0 ? (
              <p className="text-body-sm text-muted">
                No shipping methods — checkout needs at least one.
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                {methods.map((method, index) => (
                  <div key={method.id} className="rounded-sm border border-hairline p-5">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Input
                        label="Name"
                        value={method.name}
                        onChange={(e) => {
                          const next = [...methods];
                          next[index] = { ...method, name: e.target.value };
                          setMethods(next);
                        }}
                      />
                      <Input
                        label="Price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(method.price)}
                        onChange={(e) => {
                          const next = [...methods];
                          next[index] = {
                            ...method,
                            price: Number(e.target.value) as number,
                          };
                          setMethods(next);
                        }}
                      />
                      <Input
                        label="Estimated delivery"
                        value={method.estimated_delivery ?? ""}
                        onChange={(e) => {
                          const next = [...methods];
                          next[index] = { ...method, estimated_delivery: e.target.value };
                          setMethods(next);
                        }}
                      />
                      <Input
                        label="Free over"
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          method.free_shipping_threshold === null
                            ? ""
                            : String(method.free_shipping_threshold)
                        }
                        hint="Blank = never free"
                        onChange={(e) => {
                          const next = [...methods];
                          next[index] = {
                            ...method,
                            free_shipping_threshold:
                              e.target.value === "" ? null : Number(e.target.value),
                          };
                          setMethods(next);
                        }}
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                      <Checkbox
                        label="Available at checkout"
                        checked={method.is_active}
                        onChange={(e) => {
                          const next = [...methods];
                          next[index] = { ...method, is_active: e.target.checked };
                          setMethods(next);
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => saveShippingMethod(methods[index])}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeletingMethod(method)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "hero" && (
        <div className={card}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-label uppercase tracking-[0.1em] text-ink">
              Homepage hero slides
            </h2>
            <Button size="sm" variant="secondary" onClick={addSlide}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add slide
            </Button>
          </div>

          {slides.length === 0 ? (
            <p className="text-body-sm text-muted">
              No slides yet — the homepage falls back to a static hero.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {slides.map((slide, index) => (
                <div key={slide.id} className="rounded-sm border border-hairline p-5">
                  <div className="flex items-start gap-5">
                    <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
                      <GripVertical className="h-4 w-4 text-muted" aria-hidden />
                      <button
                        type="button"
                        onClick={() => moveSlide(index, -1)}
                        disabled={index === 0}
                        aria-label="Move slide up"
                        className="cursor-pointer rounded-sm px-2 text-body-sm text-muted hover:bg-ink/5 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSlide(index, 1)}
                        disabled={index === slides.length - 1}
                        aria-label="Move slide down"
                        className="cursor-pointer rounded-sm px-2 text-body-sm text-muted hover:bg-ink/5 disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>

                    <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-sm bg-cream">
                      {slide.image_url && (
                        <Image
                          src={slide.image_url}
                          alt=""
                          fill
                          sizes="144px"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                          label="Heading"
                          value={slide.heading}
                          onChange={(e) => {
                            const next = [...slides];
                            next[index] = { ...slide, heading: e.target.value };
                            setSlides(next);
                          }}
                        />
                        <Input
                          label="Subheading"
                          value={slide.subheading ?? ""}
                          onChange={(e) => {
                            const next = [...slides];
                            next[index] = { ...slide, subheading: e.target.value };
                            setSlides(next);
                          }}
                        />
                        <Input
                          label="CTA text"
                          value={slide.cta_text ?? ""}
                          onChange={(e) => {
                            const next = [...slides];
                            next[index] = { ...slide, cta_text: e.target.value };
                            setSlides(next);
                          }}
                        />
                        <Input
                          label="CTA link"
                          value={slide.cta_link ?? ""}
                          onChange={(e) => {
                            const next = [...slides];
                            next[index] = { ...slide, cta_link: e.target.value };
                            setSlides(next);
                          }}
                        />
                      </div>

                      <div className="mt-4">
                        <Input
                          label="Image URL"
                          value={slide.image_url}
                          hint="Upload via the Media library, then paste the URL here."
                          onChange={(e) => {
                            const next = [...slides];
                            next[index] = { ...slide, image_url: e.target.value };
                            setSlides(next);
                          }}
                        />
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                        <Checkbox
                          label="Slide is live"
                          checked={slide.is_active}
                          onChange={(e) => {
                            const next = [...slides];
                            next[index] = { ...slide, is_active: e.target.checked };
                            setSlides(next);
                          }}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => saveSlide(slides[index])}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeletingSlide(slide)}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <Button onClick={saveSettings} loading={saving}>
          <Save className="h-4 w-4" aria-hidden />
          Save settings
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(deletingMethod)}
        onClose={() => setDeletingMethod(null)}
        onConfirm={deleteShippingMethod}
        title="Delete this shipping method?"
        message={`"${deletingMethod?.name}" will no longer be offered at checkout. Existing orders keep their recorded method.`}
      />

      <ConfirmDialog
        open={Boolean(deletingSlide)}
        onClose={() => setDeletingSlide(null)}
        onConfirm={deleteSlide}
        title="Delete this hero slide?"
        message={`"${deletingSlide?.heading}" will be removed from the homepage carousel.`}
      />
    </>
  );
}
