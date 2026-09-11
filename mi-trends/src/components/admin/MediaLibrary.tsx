"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminUI";
import { ImageUploader, type UploadedImage } from "@/components/admin/ImageUploader";
import { ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { EASE_TACTILE } from "@/lib/motion";
import type { MediaAsset } from "@/types";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary({
  assets: initial,
  inUseUrls,
}: {
  assets: MediaAsset[];
  inUseUrls: string[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();
  const inUse = useMemo(() => new Set(inUseUrls), [inUseUrls]);

  const [assets, setAssets] = useState(initial);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<MediaAsset | null>(null);
  const [working, setWorking] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return assets;
    const term = query.trim().toLowerCase();
    return assets.filter((asset) => asset.filename.toLowerCase().includes(term));
  }, [assets, query]);

  async function handleUploads(uploaded: UploadedImage[]) {
    // ImageUploader already wrote the media rows; re-read to pick up ids.
    const { data } = await supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: false });
    setAssets((data as MediaAsset[]) ?? []);
    if (uploaded.length > 0) {
      toast.success("Media library updated");
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast.error("Couldn't copy", "Your browser blocked clipboard access.");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setWorking(true);
    try {
      // Remove the storage object too, not just the library row.
      const marker = "/storage/v1/object/public/";
      const index = deleting.url.indexOf(marker);
      if (index !== -1) {
        const rest = deleting.url.slice(index + marker.length);
        const slash = rest.indexOf("/");
        if (slash !== -1) {
          const bucket = rest.slice(0, slash);
          const path = decodeURIComponent(rest.slice(slash + 1));
          await supabase.storage.from(bucket).remove([path]);
        }
      }

      const { error } = await supabase.from("media").delete().eq("id", deleting.id);
      if (error) {
        toast.error("Couldn't delete", error.message);
        return;
      }

      setAssets((prev) => prev.filter((a) => a.id !== deleting.id));
      setDeleting(null);
      toast.success("Image deleted");
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Media library"
        description={`${assets.length} file${assets.length === 1 ? "" : "s"} in storage.`}
      />

      <div className="card-surface mb-6 p-6">
        <ImageUploader
          bucket="media-library"
          images={[]}
          onChange={handleUploads}
          max={20}
          label="Upload new images"
        />
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <label htmlFor="media-search" className="sr-only">
          Search media
        </label>
        <input
          id="media-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by filename…"
          className="h-10 w-full rounded-sm border border-ink/12 bg-white pl-9 pr-3 text-body-sm outline-none transition-colors focus:border-accent"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface">
          <EmptyState
            illustration="box"
            title={query ? "No files match that search" : "No media yet"}
            description={
              query
                ? "Try a different filename."
                : "Upload images above to build your library."
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <AnimatePresence initial={false}>
            {filtered.map((asset) => {
              const used = inUse.has(asset.url);
              return (
                <motion.div
                  key={asset.id}
                  layout
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.2, ease: EASE_TACTILE }}
                  className="card-surface group overflow-hidden"
                >
                  <div className="relative aspect-square bg-cream">
                    <Image
                      src={asset.url}
                      alt={asset.filename}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />

                    {used && (
                      <span className="absolute left-2 top-2 rounded-sm bg-accent px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-white">
                        In use
                      </span>
                    )}

                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => copyUrl(asset.url)}
                        aria-label="Copy public URL"
                        className="cursor-pointer rounded-sm bg-white/90 p-1.5 text-muted transition-colors hover:bg-white hover:text-ink"
                      >
                        {copied === asset.url ? (
                          <Check className="h-3.5 w-3.5 text-success" aria-hidden />
                        ) : (
                          <Copy className="h-3.5 w-3.5" aria-hidden />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(asset)}
                        aria-label={`Delete ${asset.filename}`}
                        className="cursor-pointer rounded-sm bg-white/90 p-1.5 text-muted transition-colors hover:bg-danger hover:text-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="truncate text-caption normal-case tracking-normal text-ink">
                      {asset.filename}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {formatBytes(asset.size)} · {formatDate(asset.created_at)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={working}
        title="Delete this image?"
        message={
          deleting && inUse.has(deleting.url)
            ? `"${deleting.filename}" is currently used by at least one product. Deleting it will leave a broken image on the storefront.`
            : `"${deleting?.filename}" will be permanently removed from storage.`
        }
      />
    </>
  );
}
