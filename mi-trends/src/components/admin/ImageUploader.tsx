"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { GripVertical, Loader2, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { EASE_TACTILE } from "@/lib/motion";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export interface UploadedImage {
  id: string;
  url: string;
}

interface ImageUploaderProps {
  bucket: "product-images" | "brand-assets" | "media-library";
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max?: number;
  /** Single-slot mode for logos and category images. */
  single?: boolean;
  label?: string;
  /** Also record each upload in the media library table. */
  trackInMediaLibrary?: boolean;
}

export function ImageUploader({
  bucket,
  images,
  onChange,
  max = 10,
  single = false,
  label = "Images",
  trackInMediaLibrary = true,
}: ImageUploaderProps) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const limit = single ? 1 : max;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const room = limit - images.length;

    if (room <= 0) {
      toast.error(`Limit reached`, `You can upload up to ${limit} image${limit === 1 ? "" : "s"}.`);
      return;
    }

    const accepted: File[] = [];
    for (const file of files.slice(0, room)) {
      if (!ACCEPTED.includes(file.type)) {
        toast.error("Unsupported file", `${file.name} is not a supported image.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error("File too large", `${file.name} is over 5 MB.`);
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length === 0) return;

    setUploading(true);
    const uploaded: UploadedImage[] = [];

    try {
      for (const file of accepted) {
        const extension = file.name.split(".").pop() ?? "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

        if (error) {
          toast.error("Upload failed", error.message);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(path);

        uploaded.push({ id: path, url: publicUrl });

        if (trackInMediaLibrary) {
          // Best-effort: a failure here should not lose the upload itself.
          await supabase.from("media").insert({
            url: publicUrl,
            filename: file.name,
            size: file.size,
            mime_type: file.type,
          });
        }
      }

      if (uploaded.length > 0) {
        onChange(single ? uploaded.slice(0, 1) : [...images, ...uploaded]);
        toast.success(
          `${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded`,
        );
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    void handleFiles(e.dataTransfer.files);
  }

  /** Reorders on drop — the first image is the featured one. */
  function reorder(targetIndex: number) {
    const from = dragIndex.current;
    if (from === null || from === targetIndex) return;

    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
    dragIndex.current = null;
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="label-caps">{label}</span>
        {!single && (
          <span className="text-caption normal-case tracking-normal text-muted">
            {images.length} / {limit}
          </span>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "mt-3 flex flex-col items-center justify-center rounded-sm border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-accent bg-accent/4" : "border-ink/12 bg-white",
        )}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden />
        ) : (
          <Upload className="h-6 w-6 text-muted" strokeWidth={1.5} aria-hidden />
        )}

        <p className="mt-4 text-body-sm text-ink">
          {uploading ? "Uploading…" : "Drag images here, or"}
        </p>

        {!uploading && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              multiple={!single}
              onChange={(e) => handleFiles(e.target.files)}
              className="sr-only"
              id={`upload-${bucket}-${label}`}
            />
            <label
              htmlFor={`upload-${bucket}-${label}`}
              className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-sm border border-ink/15 px-5 text-caption uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink/45"
            >
              Choose file{single ? "" : "s"}
            </label>
            <p className="mt-3 text-caption normal-case tracking-normal text-muted">
              JPG, PNG, WebP or AVIF — up to 5 MB each.
            </p>
          </>
        )}
      </div>

      {images.length > 0 && (
        <div
          className={cn(
            "mt-4 grid gap-3",
            single ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-3 sm:grid-cols-5",
          )}
        >
          <AnimatePresence initial={false}>
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, ease: EASE_TACTILE }}
                draggable={!single}
                onDragStart={() => (dragIndex.current = index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorder(index)}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-sm border border-hairline bg-cream",
                  !single && "cursor-grab active:cursor-grabbing",
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover"
                />

                {!single && index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-sm bg-ink px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-white">
                    Featured
                  </span>
                )}

                {!single && (
                  <span className="absolute left-1.5 bottom-1.5 rounded-sm bg-white/85 p-1 text-muted opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical className="h-3.5 w-3.5" aria-hidden />
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Remove image"
                  className="absolute right-1.5 top-1.5 cursor-pointer rounded-sm bg-white/90 p-1.5 text-muted opacity-0 transition-all hover:bg-danger hover:text-white group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
