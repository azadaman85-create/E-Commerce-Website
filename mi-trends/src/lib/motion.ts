import type { Variants, Transition } from "framer-motion";

/** The house easing curve. Used for every page-level transition. */
export const EASE_PREMIUM: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
export const EASE_TACTILE: [number, number, number, number] = [0.4, 0, 0.2, 1];

export const pageTransition: Transition = {
  duration: 0.4,
  ease: EASE_PREMIUM,
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: pageTransition },
  exit: { opacity: 0, y: -10, transition: { duration: 0.25, ease: EASE_PREMIUM } },
};

/** Scroll reveal: fade up 30px over 0.6s. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_PREMIUM },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE_PREMIUM } },
};

/** Grid containers stagger their children by 0.08s. */
export const staggerGrid: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

/** Cart items use a tighter stagger than product grids. */
export const staggerList: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export const drawerVariants: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: { type: "spring", stiffness: 320, damping: 36 },
  },
  exit: { x: "100%", transition: { duration: 0.3, ease: EASE_TACTILE } },
};

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_TACTILE },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 4,
    transition: { duration: 0.2, ease: EASE_TACTILE },
  },
};

/** Word-by-word hero headline reveal. */
export const wordStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};

export const wordChild: Variants = {
  hidden: { opacity: 0, y: "60%" },
  visible: {
    opacity: 1,
    y: "0%",
    transition: { duration: 0.7, ease: EASE_PREMIUM },
  },
};

/** Shared whileInView config — animates once, a little before fully in frame. */
export const inViewOnce = {
  initial: "hidden" as const,
  whileInView: "visible" as const,
  viewport: { once: true, margin: "-80px" },
};
