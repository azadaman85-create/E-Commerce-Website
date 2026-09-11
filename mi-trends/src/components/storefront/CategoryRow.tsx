"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, staggerGrid, inViewOnce, EASE_TACTILE } from "@/lib/motion";
import type { Category } from "@/types";

export function CategoryRow({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <motion.div
      {...inViewOnce}
      variants={staggerGrid}
      className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-6"
    >
      {categories.map((category) => (
        <motion.div
          key={category.id}
          variants={fadeUp}
          className="w-56 shrink-0 snap-start md:w-auto"
        >
          <Link href={`/products?category=${category.slug}`} className="group block">
            <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-cream">
              {category.image_url && (
                <motion.div
                  className="absolute inset-0"
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.6, ease: EASE_TACTILE }}
                >
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 224px, 16vw"
                    className="object-cover"
                  />
                </motion.div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
              <span className="absolute inset-x-4 bottom-4 font-serif text-lg text-white">
                {category.name}
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
