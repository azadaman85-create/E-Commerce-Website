"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeUp, staggerGrid, inViewOnce, EASE_TACTILE } from "@/lib/motion";

const PANELS = [
  {
    href: "/men",
    label: "Men",
    blurb: "Shirting, tailoring and outerwear",
    image:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&q=80",
  },
  {
    href: "/women",
    label: "Women",
    blurb: "Silk, cashmere and cotton poplin",
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1400&q=80",
  },
];

/** The two main entry points into the store, shown high on the homepage. */
export function GenderSplit() {
  return (
    <motion.div
      {...inViewOnce}
      variants={staggerGrid}
      className="grid gap-6 md:grid-cols-2"
    >
      {PANELS.map((panel) => (
        <motion.div key={panel.href} variants={fadeUp}>
          <Link
            href={panel.href}
            className="group relative block aspect-[4/5] overflow-hidden rounded-sm bg-cream md:aspect-[3/4]"
          >
            <motion.div
              className="absolute inset-0"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.7, ease: EASE_TACTILE }}
            >
              <Image
                src={panel.image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </motion.div>

            <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-8 md:p-10">
              <h3 className="font-serif text-4xl text-white md:text-5xl">
                {panel.label}
              </h3>
              <p className="mt-2 text-body-sm text-white/75">{panel.blurb}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-caption uppercase tracking-[0.1em] text-white">
                Shop {panel.label.toLowerCase()}
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
