"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_PREMIUM, wordChild, wordStagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/types";

const SLIDE_MS = 6000;

/** Splits a headline into words so each can be staggered independently. */
function AnimatedHeadline({ text, slideKey }: { text: string; slideKey: string }) {
  return (
    <motion.h1
      key={slideKey}
      variants={wordStagger}
      initial="hidden"
      animate="visible"
      className="font-serif text-hero-sm leading-[1.2] tracking-tight text-white md:text-hero"
    >
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-1">
          <motion.span variants={wordChild} className="inline-block">
            {word}
            {i < text.split(" ").length - 1 && " "}
          </motion.span>
        </span>
      ))}
    </motion.h1>
  );
}

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % Math.max(slides.length, 1));
  }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(advance, SLIDE_MS);
    return () => clearInterval(timer);
  }, [advance, paused, slides.length]);

  if (slides.length === 0) {
    return (
      <section className="bg-cream">
        <div className="container-page flex min-h-[60vh] flex-col items-start justify-center py-20">
          <h1 className="max-w-3xl font-serif text-hero-sm text-ink md:text-hero">
            Considered essentials, made to last.
          </h1>
          <Link
            href="/products"
            className="cta-shimmer mt-10 inline-flex h-14 items-center rounded-sm px-8 text-label uppercase tracking-[0.1em] text-white"
          >
            Shop the collection
          </Link>
        </div>
      </section>
    );
  }

  const slide = slides[index];

  return (
    <section
      className="relative h-[78vh] min-h-[560px] w-full overflow-hidden bg-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 0.9, ease: EASE_PREMIUM }, scale: { duration: 7, ease: "linear" } }}
          className="absolute inset-0"
        >
          <Image
            src={slide.image_url}
            alt=""
            fill
            sizes="100vw"
            priority={index === 0}
            className="object-cover"
          />
          {/* Scrim keeps the headline legible over any photograph. */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="container-page relative flex h-full flex-col justify-end pb-24 md:justify-center md:pb-0">
        <div className="max-w-2xl">
          <AnimatedHeadline text={slide.heading} slideKey={slide.id} />

          {slide.subheading && (
            <motion.p
              key={`${slide.id}-sub`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_PREMIUM, delay: 0.45 }}
              className="mt-6 max-w-lg text-body leading-relaxed text-white/80"
            >
              {slide.subheading}
            </motion.p>
          )}

          {slide.cta_text && slide.cta_link && (
            <motion.div
              key={`${slide.id}-cta`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_PREMIUM, delay: 0.6 }}
              className="mt-10"
            >
              <Link
                href={slide.cta_link}
                className="cta-shimmer inline-flex h-14 items-center rounded-sm px-8 text-label uppercase tracking-[0.1em] text-white shadow-card"
              >
                {slide.cta_text}
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="container-page absolute inset-x-0 bottom-8 flex items-center gap-3">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}: ${s.heading}`}
              aria-current={i === index}
              className="group h-6 flex-1 max-w-24 cursor-pointer"
            >
              <span className="relative block h-0.5 w-full overflow-hidden rounded-full bg-white/25">
                <motion.span
                  key={`${s.id}-${i === index}-${index}`}
                  className={cn(
                    "absolute inset-y-0 left-0 bg-white",
                    i < index && "w-full",
                  )}
                  initial={{ width: i === index ? "0%" : i < index ? "100%" : "0%" }}
                  animate={{ width: i === index ? "100%" : i < index ? "100%" : "0%" }}
                  transition={
                    i === index && !paused
                      ? { duration: SLIDE_MS / 1000, ease: "linear" }
                      : { duration: 0.3 }
                  }
                />
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
