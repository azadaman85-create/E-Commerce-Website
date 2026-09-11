"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

/**
 * Route-level fade+slide. Keyed on pathname so AnimatePresence sees a new
 * child on every navigation.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-[60vh]"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
