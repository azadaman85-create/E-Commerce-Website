"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeUp, staggerGrid, inViewOnce, EASE_TACTILE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Banner } from "@/types";

/**
 * Scheduled promotional banners from /admin/content. Renders nothing when
 * none are live, so the homepage does not leave a gap.
 */
export function PromoBanners({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) return null;

  return (
    <motion.div
      {...inViewOnce}
      variants={staggerGrid}
      className={cn(
        "grid gap-6",
        banners.length > 1 ? "md:grid-cols-2" : "grid-cols-1",
      )}
    >
      {banners.map((banner) => {
        const content = (
          <>
            {banner.image_url ? (
              <>
                <motion.div
                  className="absolute inset-0"
                  whileHover={{ scale: 1.04 }}
                  transition={{ duration: 0.7, ease: EASE_TACTILE }}
                >
                  <Image
                    src={banner.image_url}
                    alt=""
                    fill
                    sizes={banners.length > 1 ? "(max-width: 768px) 100vw, 50vw" : "100vw"}
                    className="object-cover"
                  />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/30 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-accent via-[#1E40AF] to-ink" />
            )}

            <div className="relative flex h-full flex-col justify-end p-8 md:p-10">
              {banner.heading && (
                <h3 className="font-serif text-3xl leading-tight text-white md:text-4xl">
                  {banner.heading}
                </h3>
              )}
              {banner.text && (
                <p className="mt-3 max-w-md text-body-sm leading-relaxed text-white/75">
                  {banner.text}
                </p>
              )}
              {banner.link && (
                <span className="mt-6 inline-flex items-center gap-2 text-caption uppercase tracking-[0.1em] text-white">
                  Shop now
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              )}
            </div>
          </>
        );

        const shell =
          "group relative block aspect-[16/9] overflow-hidden rounded-sm bg-cream md:aspect-[2/1]";

        return (
          <motion.div key={banner.id} variants={fadeUp}>
            {banner.link ? (
              <Link href={banner.link} className={shell}>
                {content}
              </Link>
            ) : (
              <div className={shell}>{content}</div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
