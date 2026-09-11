"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader } from "@/components/admin/AdminUI";
import { ImageUploader, type UploadedImage } from "@/components/admin/ImageUploader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { buildCategoryTree } from "@/lib/categories";
import { cn, slugify } from "@/lib/utils";
import { EASE_TACTILE } from "@/lib/motion";
import type { Category, CategoryNode } from "@/types";

interface FormState {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  image: UploadedImage[];
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
  image: [],
};

export function CategoriesManager({
  categories: initial,
  productCounts,
}: {
  categories: Category[];
  productCounts: Record<string, number>;
}) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();

  const [categories, setCategories] = useState(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const dragId = useMemo(() => ({ current: null as string | null }), []);

  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  async function reload() {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    setCategories((data as Category[]) ?? []);
  }

  function openCreate(parentId = "") {
    setEditing(null);
    setForm({ ...EMPTY_FORM, parentId });
    setSlugTouched(false);
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      parentId: category.parent_id ?? "",
      image: category.image_url
        ? [{ id: category.id, url: category.image_url }]
        : [],
    });
    setSlugTouched(true);
    setErrors({});
    setFormOpen(true);
  }

  /** A category may not be nested under itself or one of its descendants. */
  function descendantIds(id: string): string[] {
    const children = categories.filter((c) => c.parent_id === id);
    return children.flatMap((child) => [child.id, ...descendantIds(child.id)]);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Required.";
    if (!form.slug.trim()) next.slug = "Required.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        parent_id: form.parentId || null,
        image_url: form.image[0]?.url ?? null,
      };

      const { error } = editing
        ? await supabase.from("categories").update(payload).eq("id", editing.id)
        : await supabase
            .from("categories")
            .insert({ ...payload, sort_order: categories.length });

      if (error) {
        toast.error("Couldn't save the category", error.message);
        return;
      }

      await reload();
      setFormOpen(false);
      toast.success(editing ? "Category updated" : "Category created");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const { error } = await supabase.from("categories").delete().eq("id", deleting.id);

    if (error) {
      toast.error("Couldn't delete", error.message);
      return;
    }
    await reload();
    setDeleting(null);
    toast.success("Category deleted");
  }

  /** Drag-and-drop reorder within the same parent. */
  async function handleDrop(target: CategoryNode) {
    const sourceId = dragId.current;
    dragId.current = null;
    if (!sourceId || sourceId === target.id) return;

    const source = categories.find((c) => c.id === sourceId);
    if (!source || source.parent_id !== target.parent_id) {
      toast.info("Move within the same level", "Drag to reorder siblings only.");
      return;
    }

    const siblings = categories
      .filter((c) => c.parent_id === target.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const from = siblings.findIndex((c) => c.id === sourceId);
    const to = siblings.findIndex((c) => c.id === target.id);
    const reordered = [...siblings];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);

    // Optimistic local reorder, then persist each new position.
    setCategories((prev) =>
      prev.map((c) => {
        const index = reordered.findIndex((r) => r.id === c.id);
        return index === -1 ? c : { ...c, sort_order: index };
      }),
    );

    for (const [index, category] of reordered.entries()) {
      await supabase
        .from("categories")
        .update({ sort_order: index })
        .eq("id", category.id);
    }
    toast.success("Order updated");
  }

  function renderNode(node: CategoryNode, depth = 0) {
    const isCollapsed = collapsed.includes(node.id);
    const count = productCounts[node.id] ?? 0;

    return (
      <div key={node.id}>
        <motion.div
          layout
          draggable
          onDragStart={() => (dragId.current = node.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(node)}
          transition={{ duration: 0.2, ease: EASE_TACTILE }}
          className={cn(
            "group flex cursor-grab items-center gap-3 border-b border-hairline px-4 py-3 transition-colors last:border-0 hover:bg-cream/40 active:cursor-grabbing",
          )}
          style={{ paddingLeft: `${16 + depth * 24}px` }}
        >
          <GripVertical
            className="h-4 w-4 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />

          {node.children.length > 0 ? (
            <button
              type="button"
              onClick={() =>
                setCollapsed((prev) =>
                  prev.includes(node.id)
                    ? prev.filter((id) => id !== node.id)
                    : [...prev, node.id],
                )
              }
              aria-label={isCollapsed ? "Expand" : "Collapse"}
              aria-expanded={!isCollapsed}
              className="shrink-0 cursor-pointer rounded-sm p-1 text-muted hover:bg-ink/5"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden />
              )}
            </button>
          ) : (
            <span className="w-6 shrink-0" />
          )}

          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-cream">
            {node.image_url && (
              <Image
                src={node.image_url}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span className="block truncate text-body-sm font-medium text-ink">
              {node.name}
            </span>
            <span className="text-caption normal-case tracking-normal text-muted">
              /{node.slug} · {count} product{count === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => openCreate(node.id)}
              aria-label={`Add a subcategory under ${node.name}`}
              className="cursor-pointer rounded-sm p-2 text-muted transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => openEdit(node)}
              aria-label={`Edit ${node.name}`}
              className="cursor-pointer rounded-sm p-2 text-muted transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setDeleting(node)}
              aria-label={`Delete ${node.name}`}
              className="cursor-pointer rounded-sm p-2 text-muted transition-colors hover:bg-danger/8 hover:text-danger"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </motion.div>

        <AnimatePresence initial={false}>
          {!isCollapsed &&
            node.children.map((child) => renderNode(child, depth + 1))}
        </AnimatePresence>
      </div>
    );
  }

  const parentOptions = categories.filter(
    (c) => !editing || (c.id !== editing.id && !descendantIds(editing.id).includes(c.id)),
  );

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organise the catalogue. Drag to reorder categories within a level."
        action={
          <Button onClick={() => openCreate()}>
            <Plus className="h-4 w-4" aria-hidden />
            New category
          </Button>
        }
      />

      <div className="card-surface overflow-hidden">
        {tree.length === 0 ? (
          <EmptyState
            illustration="box"
            title="No categories yet"
            description="Categories group products and power the storefront filters."
            action={<Button onClick={() => openCreate()}>Create your first category</Button>}
          />
        ) : (
          tree.map((node) => renderNode(node))
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit category" : "New category"}
      >
        <form onSubmit={save} className="flex flex-col gap-5 p-6">
          <Input
            label="Name"
            required
            value={form.name}
            error={errors.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({
                ...f,
                name,
                slug: slugTouched ? f.slug : slugify(name),
              }));
            }}
          />

          <Input
            label="Slug"
            required
            value={form.slug}
            error={errors.slug}
            hint={`/products?category=${form.slug || "your-category"}`}
            onChange={(e) => {
              setSlugTouched(true);
              setForm({ ...form, slug: slugify(e.target.value) });
            }}
          />

          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <Select
            label="Parent category"
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
          >
            <option value="">None — top level</option>
            {parentOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <ImageUploader
            bucket="media-library"
            images={form.image}
            onChange={(image) => setForm({ ...form, image })}
            single
            label="Category image"
          />

          <div className="mt-3 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Create category"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this category?"
        message={
          deleting
            ? `"${deleting.name}" has ${productCounts[deleting.id] ?? 0} product(s). They will become uncategorised, and any subcategories will move to the top level.`
            : ""
        }
      />
    </>
  );
}
