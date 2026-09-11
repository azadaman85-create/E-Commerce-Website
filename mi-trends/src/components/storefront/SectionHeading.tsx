"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeUp, inViewOnce } from "@/lib/motion";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
}: SectionHeadingProps) {
  return (
    <motion.div
      {...inViewOnce}
      variants={fadeUp}
      className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
    >
      <div className="max-w-2xl">
        {eyebrow && <span className="label-caps">{eyebrow}</span>}
        <h2 className="mt-3 font-serif text-section-sm leading-tight text-ink md:text-section">
          {title}
        </h2>
        {description && (
          <p className="mt-4 text-body leading-relaxed text-muted">{description}</p>
        )}
      </div>

      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-2 text-caption uppercase tracking-[0.1em] text-ink transition-colors hover:text-accent"
        >
          {linkLabel}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
      )}
    </motion.div>
  );
}
