"use client";

import { motion } from "framer-motion";
import { EASE_PREMIUM } from "@/lib/motion";

/** SVG path-draw checkmark inside a circle that scales in. */
export function AnimatedCheck() {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-success/10"
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 52 52"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-success"
        aria-hidden
      >
        <motion.circle
          cx="26"
          cy="26"
          r="23"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: EASE_PREMIUM, delay: 0.15 }}
        />
        <motion.path
          d="M15 27l8 8 15-16"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, ease: EASE_PREMIUM, delay: 0.6 }}
        />
      </svg>
    </motion.div>
  );
}
