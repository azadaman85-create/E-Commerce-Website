"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_TACTILE } from "@/lib/motion";
import type { ProductImage } from "@/types";

interface ProductGalleryProps {
  images: ProductImage[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  // Pinch-to-zoom state for touch devices.
  const [touchScale, setTouchScale] = useState(1);
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const select = useCallback((next: number) => {
    setIndex(next);
    // Retrigger the scale pulse on the main image.
    setPulse((p) => p + 1);
  }, []);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const distanceBetween = (touches: React.TouchList) => {
    const [a, b] = [touches[0], touches[1]];
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    pinchStart.current = {
      distance: distanceBetween(e.touches),
      scale: touchScale,
    };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || !pinchStart.current) return;
    e.preventDefault();
    const ratio = distanceBetween(e.touches) / pinchStart.current.distance;
    setTouchScale(Math.min(3, Math.max(1, pinchStart.current.scale * ratio)));
  };

  const onTouchEnd = () => {
    pinchStart.current = null;
    // Snap back if the user barely zoomed.
    if (touchScale < 1.15) setTouchScale(1);
  };

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-sm bg-cream text-caption uppercase tracking-[0.1em] text-muted">
        No image available
      </div>
    );
  }

  const current = images[index];

  return (
    <div className="flex flex-col gap-4 lg:flex-row-reverse lg:gap-6">
      <div
        ref={frameRef}
        className="relative aspect-[4/5] flex-1 overflow-hidden rounded-sm bg-cream"
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={onMouseMove}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current.id}-${pulse}`}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_TACTILE }}
            className="absolute inset-0"
          >
            <motion.div
              className="relative h-full w-full"
              animate={{
                scale: touchScale > 1 ? touchScale : zooming ? 1.6 : 1,
              }}
              transition={{ duration: 0.4, ease: EASE_TACTILE }}
              style={{ transformOrigin: `${origin.x}% ${origin.y}%` }}
            >
              <Image
                src={current.image_url}
                alt={current.alt_text ?? title}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                priority={index === 0}
                className="object-cover"
                draggable={false}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-caption normal-case tracking-normal text-muted backdrop-blur lg:hidden">
          <ZoomIn className="h-3.5 w-3.5" aria-hidden />
          Pinch to zoom
        </div>

        <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-caption normal-case tracking-normal text-muted backdrop-blur">
          {index + 1} / {images.length}
        </span>
      </div>

      {images.length > 1 && (
        <div
          className="no-scrollbar flex gap-3 overflow-x-auto lg:w-20 lg:flex-col lg:overflow-visible"
          role="tablist"
          aria-label="Product images"
        >
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`View image ${i + 1}`}
              onClick={() => select(i)}
              className={cn(
                "relative aspect-[4/5] w-16 shrink-0 cursor-pointer overflow-hidden rounded-sm border-2 transition-colors lg:w-full",
                i === index ? "border-ink" : "border-transparent hover:border-ink/25",
              )}
            >
              <Image
                src={image.image_url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
