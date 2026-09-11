"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, inViewOnce } from "@/lib/motion";
import { useSettings } from "@/context/SettingsContext";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function diff(target: number): Remaining | null {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
  };
}

/** Renders only while a sale is active and its end date is in the future. */
export function PromoBanner() {
  const settings = useSettings();
  const endsAt = settings.sale_ends_at
    ? new Date(settings.sale_ends_at).getTime()
    : null;

  const [remaining, setRemaining] = useState<Remaining | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!endsAt) return;

    setRemaining(diff(endsAt));
    const timer = setInterval(() => {
      const next = diff(endsAt);
      setRemaining(next);
      if (!next) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [endsAt]);

  if (!settings.sale_active) return null;
  // Avoid a hydration mismatch: the countdown is client-time dependent.
  if (endsAt && mounted && !remaining) return null;

  const units = remaining
    ? [
        { label: "Days", value: remaining.days },
        { label: "Hours", value: remaining.hours },
        { label: "Mins", value: remaining.minutes },
        { label: "Secs", value: remaining.seconds },
      ]
    : [];

  return (
    <motion.section {...inViewOnce} variants={fadeUp} className="container-page">
      <div className="relative overflow-hidden rounded-sm bg-gradient-to-br from-accent via-[#1E40AF] to-ink px-8 py-16 text-center text-white md:px-16 md:py-20">
        <h2 className="font-serif text-section-sm leading-tight md:text-section">
          {settings.sale_headline ?? "Limited time offer"}
        </h2>

        {units.length > 0 && (
          <div className="mt-10 flex items-center justify-center gap-3 md:gap-6">
            {units.map((unit) => (
              <div key={unit.label} className="min-w-16 md:min-w-20">
                <div className="rounded-sm bg-white/10 px-3 py-4 backdrop-blur-sm md:px-5">
                  <span className="block font-serif text-3xl tabular-nums md:text-4xl">
                    {String(unit.value).padStart(2, "0")}
                  </span>
                </div>
                <span className="mt-2 block text-caption uppercase tracking-[0.1em] text-white/60">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <Link
          href="/products"
          className="mt-10 inline-flex h-14 items-center rounded-sm bg-white px-8 text-label uppercase tracking-[0.1em] text-ink transition-colors hover:bg-cream"
        >
          Shop the sale
        </Link>
      </div>
    </motion.section>
  );
}
