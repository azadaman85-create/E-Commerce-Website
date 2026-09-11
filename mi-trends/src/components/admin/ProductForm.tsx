"use client";

import { useMemo, useState } from "react";
import dynamicImport from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/admin/AdminUI";
import { ImageUploader, type UploadedImage } from "@/components/admin/ImageUploader";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { cn, slugify } from "@/lib/utils";
import { EASE_TACTILE } from "@/lib/motion";
import type { Category, ProductWithRelations } from "@/types";

const RichTextEditor = dynamicImport(
  () => import("@/components/admin/RichTextEditor").then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> },
);

interface OptionDraft {
  name: string;
  values: string[];
}

interface VariantDraft {
  key: string;
  combination: { option_name: string; value: string }[];
  sku: string;
  price: string;
  stock: string;
}

/** Cartesian product of every option's values. */
function buildCombinations(options: OptionDraft[]) {
  const usable = options.filter((o) => o.name.trim() && o.values.length > 0);
  if (usable.length === 0) return [];

  return usable.reduce<{ option_name: string; value: string }[][]>(
    (acc, option) =>
      acc.flatMap((combo) =>
        option.values.map((value) => [
          ...combo,
          { option_name: option.name.trim(), value },
        ]),
      ),
    [[]],
  );
}

function comboKey(combo: { option_name: string; value: string }[]) {
  return combo.map((c) => `${c.option_name}:${c.value}`).join("|");
}

export function ProductForm({
  product,
  categories,
}: {
  product: ProductWithRelations | null;
  categories: Category[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(product);

  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [shortDescription, setShortDescription] = useState(
    product?.short_description ?? "",
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [tags, setTags] = useState<string[]>(product?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");

  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [salePrice, setSalePrice] = useState(
    product?.sale_price != null ? String(product.sale_price) : "",
  );
  const [saleStart, setSaleStart] = useState(product?.sale_start?.slice(0, 10) ?? "");
  const [saleEnd, setSaleEnd] = useState(product?.sale_end?.slice(0, 10) ?? "");

  const [sku, setSku] = useState(product?.sku ?? "");
  const [stock, setStock] = useState(String(product?.stock_quantity ?? 0));
  const [trackInventory, setTrackInventory] = useState(
    product?.track_inventory ?? true,
  );
  const [allowBackorders, setAllowBackorders] = useState(
    product?.allow_backorders ?? false,
  );

  const [images, setImages] = useState<UploadedImage[]>(
    (product?.product_images ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => ({ id: img.id, url: img.image_url })),
  );

  const [options, setOptions] = useState<OptionDraft[]>(
    (product?.product_options ?? []).map((o) => ({
      name: o.name,
      values: (o.product_option_values ?? []).map((v) => v.value),
    })),
  );
  const [optionValueDrafts, setOptionValueDrafts] = useState<Record<number, string>>({});

  const [variants, setVariants] = useState<VariantDraft[]>(
    (product?.product_variants ?? []).map((v) => ({
      key: comboKey(v.option_values),
      combination: v.option_values,
      sku: v.sku ?? "",
      price: v.price != null ? String(v.price) : "",
      stock: String(v.stock_quantity),
    })),
  );

  const [metaTitle, setMetaTitle] = useState(product?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(
    product?.meta_description ?? "",
  );
  const [ogImage, setOgImage] = useState(product?.og_image_url ?? "");
  const [status, setStatus] = useState<"draft" | "active">(product?.status ?? "draft");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function addTag() {
    const value = tagDraft.trim();
    if (!value || tags.includes(value)) {
      setTagDraft("");
      return;
    }
    setTags([...tags, value]);
    setTagDraft("");
  }

  function regenerateVariants() {
    const combinations = buildCombinations(options);
    if (combinations.length === 0) {
      setVariants([]);
      return;
    }

    // Preserve any price/stock the admin already entered for a combination
    // that still exists after the option change.
    const existing = new Map(variants.map((v) => [v.key, v]));

    setVariants(
      combinations.map((combination) => {
        const key = comboKey(combination);
        const prior = existing.get(key);
        return (
          prior ?? {
            key,
            combination,
            sku: sku
              ? `${sku}-${combination.map((c) => c.value.slice(0, 3).toUpperCase()).join("-")}`
              : "",
            price: "",
            stock: "0",
          }
        );
      }),
    );
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "A title is required.";
    if (!slug.trim()) next.slug = "A slug is required.";

    const priceValue = Number(price);
    if (!price.trim() || Number.isNaN(priceValue) || priceValue < 0) {
      next.price = "Enter a valid price.";
    }

    if (salePrice.trim()) {
      const saleValue = Number(salePrice);
      if (Number.isNaN(saleValue) || saleValue < 0) {
        next.salePrice = "Enter a valid sale price.";
      } else if (saleValue >= priceValue) {
        next.salePrice = "The sale price must be below the regular price.";
      }
    }

    if (saleStart && saleEnd && new Date(saleStart) > new Date(saleEnd)) {
      next.saleEnd = "The sale must end after it starts.";
    }

    if (trackInventory && (Number.isNaN(Number(stock)) || Number(stock) < 0)) {
      next.stock = "Enter a valid stock quantity.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Check the form", "Some fields need attention.");
    }
    return Object.keys(next).length === 0;
  }

  async function save(publish?: boolean) {
    if (!validate()) return;

    const nextStatus = publish === undefined ? status : publish ? "active" : "draft";
    setSaving(true);

    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        description: description || null,
        short_description: shortDescription.trim() || null,
        category_id: categoryId || null,
        price: Number(price),
        sale_price: salePrice.trim() ? Number(salePrice) : null,
        sale_start: saleStart ? new Date(saleStart).toISOString() : null,
        sale_end: saleEnd ? new Date(saleEnd).toISOString() : null,
        sku: sku.trim() || null,
        stock_quantity: trackInventory ? Number(stock) : 0,
        track_inventory: trackInventory,
        allow_backorders: allowBackorders,
        status: nextStatus,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        og_image_url: ogImage.trim() || images[0]?.url || null,
        tags,
      };

      let productId = product?.id;

      if (isEdit && productId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", productId);
        if (error) {
          toast.error("Couldn't save", error.message);
          return;
        }
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error || !data) {
          toast.error("Couldn't create the product", error?.message ?? "Unknown error.");
          return;
        }
        productId = (data as { id: string }).id;
      }

      // Images, options and variants are replaced wholesale — simpler and
      // safer than diffing, and these tables are small per product.
      await supabase.from("product_images").delete().eq("product_id", productId);
      if (images.length > 0) {
        await supabase.from("product_images").insert(
          images.map((image, index) => ({
            product_id: productId,
            image_url: image.url,
            sort_order: index,
            alt_text: title.trim(),
          })),
        );
      }

      // Deleting the options cascades to their values and leaves variants
      // orphaned, so variants are rewritten too.
      await supabase.from("product_options").delete().eq("product_id", productId);
      await supabase.from("product_variants").delete().eq("product_id", productId);

      const usableOptions = options.filter((o) => o.name.trim() && o.values.length > 0);

      for (const [index, option] of usableOptions.entries()) {
        const { data: optionRow } = await supabase
          .from("product_options")
          .insert({
            product_id: productId,
            name: option.name.trim(),
            sort_order: index,
          })
          .select("id")
          .single();

        if (optionRow) {
          await supabase.from("product_option_values").insert(
            option.values.map((value, valueIndex) => ({
              option_id: (optionRow as { id: string }).id,
              value,
              sort_order: valueIndex,
            })),
          );
        }
      }

      if (variants.length > 0) {
        await supabase.from("product_variants").insert(
          variants.map((variant) => ({
            product_id: productId,
            sku: variant.sku.trim() || null,
            price: variant.price.trim() ? Number(variant.price) : null,
            stock_quantity: Number(variant.stock) || 0,
            option_values: variant.combination,
          })),
        );
      }

      toast.success(isEdit ? "Product saved" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const card = "card-surface p-6";
  const grid = "grid gap-5 sm:grid-cols-2";

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit product" : "New product"}
        description={isEdit ? product?.title : "Add a product to the catalogue."}
        action={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => save(false)}
              loading={saving && status === "draft"}
            >
              Save as draft
            </Button>
            <Button onClick={() => save(true)} loading={saving && status === "active"}>
              Publish
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Basics
            </h2>
            <div className="flex flex-col gap-5">
              <Input
                label="Title"
                required
                value={title}
                error={errors.title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
              <Input
                label="Slug"
                required
                value={slug}
                error={errors.slug}
                hint={`/products/${slug || "your-product"}`}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
              />
              <Textarea
                label="Short description"
                rows={3}
                maxLength={300}
                value={shortDescription}
                hint="Shown on product cards and in search results."
                onChange={(e) => setShortDescription(e.target.value)}
              />
              <RichTextEditor value={description} onChange={setDescription} />
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Media
            </h2>
            <ImageUploader
              bucket="product-images"
              images={images}
              onChange={setImages}
              max={10}
              label="Product images"
            />
          </div>

          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Pricing
            </h2>
            <div className="flex flex-col gap-5">
              <div className={grid}>
                <Input
                  label="Regular price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={price}
                  error={errors.price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <Input
                  label="Sale price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={salePrice}
                  error={errors.salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                />
              </div>
              <div className={grid}>
                <Input
                  label="Sale starts"
                  type="date"
                  value={saleStart}
                  onChange={(e) => setSaleStart(e.target.value)}
                />
                <Input
                  label="Sale ends"
                  type="date"
                  value={saleEnd}
                  error={errors.saleEnd}
                  onChange={(e) => setSaleEnd(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Inventory
            </h2>
            <div className="flex flex-col gap-5">
              <div className={grid}>
                <Input
                  label="SKU"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
                <Input
                  label="Stock quantity"
                  type="number"
                  min="0"
                  step="1"
                  disabled={!trackInventory}
                  value={stock}
                  error={errors.stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
              <Checkbox
                label="Track inventory for this product"
                checked={trackInventory}
                onChange={(e) => setTrackInventory(e.target.checked)}
              />
              <Checkbox
                label="Allow backorders when out of stock"
                checked={allowBackorders}
                onChange={(e) => setAllowBackorders(e.target.checked)}
              />
            </div>
          </div>

          <div className={card}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-label uppercase tracking-[0.1em] text-ink">
                Options &amp; variants
              </h2>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setOptions([...options, { name: "", values: [] }])}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add option
              </Button>
            </div>

            {options.length === 0 ? (
              <p className="text-body-sm text-muted">
                No options yet. Add one — for example Size or Colour — to generate
                variant combinations.
              </p>
            ) : (
              <div className="flex flex-col gap-6">
                {options.map((option, index) => (
                  <div key={index} className="rounded-sm border border-hairline p-5">
                    <div className="flex items-end gap-3">
                      <Input
                        label="Option name"
                        value={option.name}
                        onChange={(e) => {
                          const next = [...options];
                          next[index] = { ...option, name: e.target.value };
                          setOptions(next);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setOptions(options.filter((_, i) => i !== index))}
                        aria-label="Remove option"
                        className="mb-1 h-12 cursor-pointer rounded-sm px-3 text-muted transition-colors hover:bg-danger/8 hover:text-danger"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {option.values.map((value) => (
                        <span
                          key={value}
                          className="flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-caption normal-case tracking-normal text-ink"
                        >
                          {value}
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...options];
                              next[index] = {
                                ...option,
                                values: option.values.filter((v) => v !== value),
                              };
                              setOptions(next);
                            }}
                            aria-label={`Remove ${value}`}
                            className="cursor-pointer text-muted transition-colors hover:text-danger"
                          >
                            <X className="h-3 w-3" aria-hidden />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <input
                        value={optionValueDrafts[index] ?? ""}
                        onChange={(e) =>
                          setOptionValueDrafts({
                            ...optionValueDrafts,
                            [index]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          const value = (optionValueDrafts[index] ?? "").trim();
                          if (!value || option.values.includes(value)) return;
                          const next = [...options];
                          next[index] = { ...option, values: [...option.values, value] };
                          setOptions(next);
                          setOptionValueDrafts({ ...optionValueDrafts, [index]: "" });
                        }}
                        placeholder="Add a value, then press Enter"
                        aria-label={`Add a value to ${option.name || "this option"}`}
                        className="h-11 flex-1 rounded-sm border border-ink/12 px-4 text-body-sm outline-none transition-colors focus:border-accent"
                      />
                    </div>
                  </div>
                ))}

                <Button variant="secondary" onClick={regenerateVariants}>
                  Generate {buildCombinations(options).length} variant combination(s)
                </Button>
              </div>
            )}

            <AnimatePresence>
              {variants.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: EASE_TACTILE }}
                  className="mt-8 overflow-hidden"
                >
                  <div className="overflow-x-auto rounded-sm border border-hairline">
                    <table className="w-full min-w-[560px] text-left">
                      <thead>
                        <tr className="border-b border-hairline bg-cream/50">
                          {["Variant", "SKU", "Price override", "Stock"].map((header) => (
                            <th
                              key={header}
                              scope="col"
                              className="px-4 py-2.5 text-caption uppercase tracking-[0.1em] text-muted"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((variant, index) => (
                          <tr key={variant.key} className="border-b border-hairline last:border-0">
                            <td className="px-4 py-2 text-body-sm text-ink">
                              {variant.combination.map((c) => c.value).join(" / ")}
                            </td>
                            <td className="px-4 py-2">
                              <input
                                value={variant.sku}
                                aria-label={`SKU for ${variant.key}`}
                                onChange={(e) => {
                                  const next = [...variants];
                                  next[index] = { ...variant, sku: e.target.value };
                                  setVariants(next);
                                }}
                                className="h-9 w-full rounded-sm border border-ink/12 px-2 text-body-sm outline-none focus:border-accent"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={variant.price}
                                placeholder="—"
                                aria-label={`Price for ${variant.key}`}
                                onChange={(e) => {
                                  const next = [...variants];
                                  next[index] = { ...variant, price: e.target.value };
                                  setVariants(next);
                                }}
                                className="h-9 w-28 rounded-sm border border-ink/12 px-2 text-body-sm outline-none focus:border-accent"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={variant.stock}
                                aria-label={`Stock for ${variant.key}`}
                                onChange={(e) => {
                                  const next = [...variants];
                                  next[index] = { ...variant, stock: e.target.value };
                                  setVariants(next);
                                }}
                                className="h-9 w-24 rounded-sm border border-ink/12 px-2 text-body-sm outline-none focus:border-accent"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Status
            </h2>
            <Select
              label="Visibility"
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "active")}
            >
              <option value="draft">Draft — hidden from the storefront</option>
              <option value="active">Active — visible to everyone</option>
            </Select>
          </div>

          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Organisation
            </h2>
            <div className="flex flex-col gap-5">
              <Select
                label="Category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Uncategorised</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>

              <div>
                <span className="label-caps">Tags</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-caption normal-case tracking-normal text-ink"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                        aria-label={`Remove tag ${tag}`}
                        className="cursor-pointer text-muted transition-colors hover:text-danger"
                      >
                        <X className="h-3 w-3" aria-hidden />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  onBlur={addTag}
                  placeholder="Add a tag, then press Enter"
                  aria-label="Add a tag"
                  className="mt-3 h-11 w-full rounded-sm border border-ink/12 px-4 text-body-sm outline-none transition-colors focus:border-accent"
                />
              </div>
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              SEO
            </h2>
            <div className="flex flex-col gap-5">
              <Input
                label="Meta title"
                value={metaTitle}
                maxLength={70}
                hint={`${metaTitle.length}/70 — defaults to the product title.`}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
              <Textarea
                label="Meta description"
                rows={3}
                maxLength={160}
                value={metaDescription}
                hint={`${metaDescription.length}/160`}
                onChange={(e) => setMetaDescription(e.target.value)}
              />
              <Input
                label="OG image URL"
                value={ogImage}
                hint="Defaults to the featured image."
                onChange={(e) => setOgImage(e.target.value)}
              />
            </div>
          </div>
        </aside>
      </div>

      <div className={cn("mt-8 flex justify-end gap-3")}>
        <Button variant="ghost" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={() => save(false)} loading={saving}>
          Save as draft
        </Button>
        <Button onClick={() => save(true)} loading={saving}>
          {isEdit ? "Save and publish" : "Publish"}
        </Button>
      </div>
    </>
  );
}
