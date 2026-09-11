"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StarsProps {
  rating: number;
  size?: number;
  className?: string;
  showValue?: boolean;
}

/** Read-only rating display. Renders half-stars via a clipped overlay. */
export function Stars({ rating, size = 16, className, showValue }: StarsProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`Rated ${rating.toFixed(1)} out of 5`}
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.min(Math.max(rating - i, 0), 1);
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <Star
                className="absolute inset-0 text-ink/15"
                style={{ width: size, height: size }}
                strokeWidth={1.5}
                aria-hidden
              />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className="text-[#F59E0B]"
                  style={{ width: size, height: size }}
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden
                />
              </span>
            </span>
          );
        })}
      </div>
      {showValue && (
        <span className="text-caption normal-case tracking-normal text-muted">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

interface StarInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

/** Interactive rating selector for the review form. */
export function StarInput({ value, onChange, size = 28 }: StarInputProps) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          whileTap={{ scale: 0.88 }}
          onMouseEnter={() => setHovered(star)}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} out of 5`}
          aria-pressed={value === star}
          className="cursor-pointer rounded-sm p-1"
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              "transition-colors duration-150",
              star <= active ? "text-[#F59E0B]" : "text-ink/20",
            )}
            fill={star <= active ? "currentColor" : "none"}
            strokeWidth={1.5}
            aria-hidden
          />
        </motion.button>
      ))}
    </div>
  );
}
