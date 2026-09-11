"use client";

import { motion } from "framer-motion";
import { Leaf, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { fadeUp, staggerGrid, inViewOnce } from "@/lib/motion";
import { Stars } from "@/components/ui/Stars";
import type { Testimonial } from "@/types";

const trustBadges = [
  { Icon: Truck, label: "Free shipping over ₹2,000" },
  { Icon: RotateCcw, label: "30-day returns" },
  { Icon: ShieldCheck, label: "Secure payments" },
  { Icon: PackageCheck, label: "Dispatched in 24 hours" },
  { Icon: Leaf, label: "Responsibly sourced" },
];

/** Infinite marquee — the track is duplicated so the loop is seamless. */
export function TrustBadges() {
  return (
    <div className="overflow-hidden border-y border-hairline bg-cream py-6">
      <div className="flex w-max animate-marquee gap-16 hover:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-16" aria-hidden={copy === 1}>
            {trustBadges.map(({ Icon, label }) => (
              <div
                key={label}
                className="flex shrink-0 items-center gap-3 text-caption uppercase tracking-[0.1em] text-muted"
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                {label}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <motion.div
      {...inViewOnce}
      variants={staggerGrid}
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
    >
      {testimonials.map((t) => (
        <motion.figure key={t.id} variants={fadeUp} className="card-surface flex flex-col p-8">
          <Stars rating={t.rating} size={14} />
          <blockquote className="mt-5 flex-1 text-body-sm leading-relaxed text-ink">
            &ldquo;{t.quote}&rdquo;
          </blockquote>
          <figcaption className="mt-6 border-t border-hairline pt-5">
            <span className="block text-body-sm font-medium text-ink">
              {t.author_name}
            </span>
            {t.author_role && <span className="label-caps">{t.author_role}</span>}
          </figcaption>
        </motion.figure>
      ))}
    </motion.div>
  );
}
