"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Checkbox } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader } from "@/components/admin/AdminUI";
import { StarInput } from "@/components/ui/Stars";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Banner, SocialPost, Testimonial } from "@/types";

type Tab = "testimonials" | "social" | "banners";

const TABS: { id: Tab; label: string }[] = [
  { id: "testimonials", label: "Testimonials" },
  { id: "social", label: "Social feed" },
  { id: "banners", label: "Promo banners" },
];

/** Everything on the homepage that is not a product, hero slide or setting. */
export function ContentManager({
  testimonials: initialTestimonials,
  socialPosts: initialSocial,
  banners: initialBanners,
}: {
  testimonials: Testimonial[];
  socialPosts: SocialPost[];
  banners: Banner[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("testimonials");
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [social, setSocial] = useState(initialSocial);
  const [banners, setBanners] = useState(initialBanners);
  const [pendingDelete, setPendingDelete] = useState<
    { table: string; id: string; label: string } | null
  >(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function saveRow(table: string, id: string, payload: Record<string, unknown>) {
    setSavingId(id);
    try {
      const { error } = await supabase.from(table).update(payload).eq("id", id);
      if (error) {
        toast.error("Couldn't save", error.message);
        return;
      }
      toast.success("Saved");
    } finally {
      setSavingId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { table, id } = pendingDelete;

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete", error.message);
      return;
    }

    if (table === "testimonials") setTestimonials((p) => p.filter((x) => x.id !== id));
    if (table === "social_posts") setSocial((p) => p.filter((x) => x.id !== id));
    if (table === "banners") setBanners((p) => p.filter((x) => x.id !== id));

    setPendingDelete(null);
    toast.success("Deleted");
  }

  async function addTestimonial() {
    const { data, error } = await supabase
      .from("testimonials")
      .insert({
        author_name: "New reviewer",
        quote: "Their words go here.",
        rating: 5,
        sort_order: testimonials.length,
      })
      .select()
      .single();

    if (error) {
      toast.error("Couldn't add", error.message);
      return;
    }
    setTestimonials([...testimonials, data as Testimonial]);
  }

  async function addSocialPost() {
    const { data, error } = await supabase
      .from("social_posts")
      .insert({
        image_url:
          "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80",
        link: "/products",
        sort_order: social.length,
      })
      .select()
      .single();

    if (error) {
      toast.error("Couldn't add", error.message);
      return;
    }
    setSocial([...social, data as SocialPost]);
  }

  async function addBanner() {
    const { data, error } = await supabase
      .from("banners")
      .insert({ heading: "New promotion", is_active: false })
      .select()
      .single();

    if (error) {
      toast.error("Couldn't add", error.message);
      return;
    }
    setBanners([...banners, data as Banner]);
  }

  const card = "rounded-sm border border-hairline p-5";

  return (
    <>
      <PageHeader
        title="Content"
        description="Homepage testimonials, the social feed and promotional banners."
        action={
          <Button
            onClick={
              tab === "testimonials"
                ? addTestimonial
                : tab === "social"
                  ? addSocialPost
                  : addBanner
            }
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add{" "}
            {tab === "testimonials"
              ? "testimonial"
              : tab === "social"
                ? "post"
                : "banner"}
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
              tab === t.id
                ? "bg-ink text-white"
                : "text-muted hover:bg-ink/5 hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------- testimonials -- */}
      {tab === "testimonials" && (
        <div className="card-surface p-6">
          {testimonials.length === 0 ? (
            <EmptyState
              illustration="box"
              title="No testimonials yet"
              description="These appear in the “What customers say” row on the homepage."
              action={<Button onClick={addTestimonial}>Add the first one</Button>}
            />
          ) : (
            <div className="flex flex-col gap-5">
              {testimonials.map((t, index) => (
                <div key={t.id} className={card}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Author name"
                      value={t.author_name}
                      onChange={(e) => {
                        const next = [...testimonials];
                        next[index] = { ...t, author_name: e.target.value };
                        setTestimonials(next);
                      }}
                    />
                    <Input
                      label="Location or role"
                      value={t.author_role ?? ""}
                      onChange={(e) => {
                        const next = [...testimonials];
                        next[index] = { ...t, author_role: e.target.value };
                        setTestimonials(next);
                      }}
                    />
                  </div>

                  <div className="mt-4">
                    <Textarea
                      label="Quote"
                      rows={3}
                      value={t.quote}
                      onChange={(e) => {
                        const next = [...testimonials];
                        next[index] = { ...t, quote: e.target.value };
                        setTestimonials(next);
                      }}
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="label-caps">Rating</span>
                      <StarInput
                        value={t.rating}
                        size={20}
                        onChange={(rating) => {
                          const next = [...testimonials];
                          next[index] = { ...t, rating };
                          setTestimonials(next);
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <Checkbox
                        label="Live"
                        checked={t.is_active}
                        onChange={(e) => {
                          const next = [...testimonials];
                          next[index] = { ...t, is_active: e.target.checked };
                          setTestimonials(next);
                        }}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={savingId === t.id}
                        onClick={() =>
                          saveRow("testimonials", t.id, {
                            author_name: testimonials[index].author_name,
                            author_role: testimonials[index].author_role || null,
                            quote: testimonials[index].quote,
                            rating: testimonials[index].rating,
                            is_active: testimonials[index].is_active,
                          })
                        }
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          setPendingDelete({
                            table: "testimonials",
                            id: t.id,
                            label: t.author_name,
                          })
                        }
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
      )}

      {/* --------------------------------------------------------- social -- */}
      {tab === "social" && (
        <div className="card-surface p-6">
          {social.length === 0 ? (
            <EmptyState
              illustration="box"
              title="No social posts yet"
              description="These fill the “From the feed” grid on the homepage."
              action={<Button onClick={addSocialPost}>Add the first one</Button>}
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {social.map((post, index) => (
                <div key={post.id} className={card}>
                  <div className="flex gap-4">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-cream">
                      {post.image_url && (
                        <Image
                          src={post.image_url}
                          alt=""
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-4">
                      <Input
                        label="Image URL"
                        value={post.image_url}
                        onChange={(e) => {
                          const next = [...social];
                          next[index] = { ...post, image_url: e.target.value };
                          setSocial(next);
                        }}
                      />
                      <Input
                        label="Link"
                        value={post.link ?? ""}
                        onChange={(e) => {
                          const next = [...social];
                          next[index] = { ...post, link: e.target.value };
                          setSocial(next);
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <Checkbox
                      label="Live"
                      checked={post.is_active}
                      onChange={(e) => {
                        const next = [...social];
                        next[index] = { ...post, is_active: e.target.checked };
                        setSocial(next);
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={savingId === post.id}
                        onClick={() =>
                          saveRow("social_posts", post.id, {
                            image_url: social[index].image_url,
                            link: social[index].link || null,
                            is_active: social[index].is_active,
                          })
                        }
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          setPendingDelete({
                            table: "social_posts",
                            id: post.id,
                            label: "this post",
                          })
                        }
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
      )}

      {/* -------------------------------------------------------- banners -- */}
      {tab === "banners" && (
        <div className="card-surface p-6">
          {banners.length === 0 ? (
            <EmptyState
              illustration="box"
              title="No promo banners"
              description="Scheduled banners with a start and end date, shown on the storefront."
              action={<Button onClick={addBanner}>Create a banner</Button>}
            />
          ) : (
            <div className="flex flex-col gap-5">
              {banners.map((banner, index) => (
                <div key={banner.id} className={card}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Heading"
                      value={banner.heading ?? ""}
                      onChange={(e) => {
                        const next = [...banners];
                        next[index] = { ...banner, heading: e.target.value };
                        setBanners(next);
                      }}
                    />
                    <Input
                      label="Link"
                      value={banner.link ?? ""}
                      onChange={(e) => {
                        const next = [...banners];
                        next[index] = { ...banner, link: e.target.value };
                        setBanners(next);
                      }}
                    />
                  </div>

                  <div className="mt-4">
                    <Textarea
                      label="Body text"
                      rows={2}
                      value={banner.text ?? ""}
                      onChange={(e) => {
                        const next = [...banners];
                        next[index] = { ...banner, text: e.target.value };
                        setBanners(next);
                      }}
                    />
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <Input
                      label="Image URL"
                      value={banner.image_url ?? ""}
                      onChange={(e) => {
                        const next = [...banners];
                        next[index] = { ...banner, image_url: e.target.value };
                        setBanners(next);
                      }}
                    />
                    <Input
                      label="Starts"
                      type="date"
                      value={banner.starts_at?.slice(0, 10) ?? ""}
                      onChange={(e) => {
                        const next = [...banners];
                        next[index] = {
                          ...banner,
                          starts_at: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                        };
                        setBanners(next);
                      }}
                    />
                    <Input
                      label="Ends"
                      type="date"
                      value={banner.ends_at?.slice(0, 10) ?? ""}
                      onChange={(e) => {
                        const next = [...banners];
                        next[index] = {
                          ...banner,
                          ends_at: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                        };
                        setBanners(next);
                      }}
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <Checkbox
                      label="Active"
                      checked={banner.is_active}
                      onChange={(e) => {
                        const next = [...banners];
                        next[index] = { ...banner, is_active: e.target.checked };
                        setBanners(next);
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={savingId === banner.id}
                        onClick={() =>
                          saveRow("banners", banner.id, {
                            heading: banners[index].heading || null,
                            text: banners[index].text || null,
                            link: banners[index].link || null,
                            image_url: banners[index].image_url || null,
                            starts_at: banners[index].starts_at,
                            ends_at: banners[index].ends_at,
                            is_active: banners[index].is_active,
                          })
                        }
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          setPendingDelete({
                            table: "banners",
                            id: banner.id,
                            label: banner.heading ?? "this banner",
                          })
                        }
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
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this item?"
        message={`"${pendingDelete?.label}" will be removed permanently.`}
      />
    </>
  );
}
