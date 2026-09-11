"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

const variantStyles: Record<Variant, string> = {
  primary: "cta-shimmer text-white shadow-card hover:shadow-card-hover",
  secondary:
    "bg-white text-ink border border-ink/15 hover:border-ink/40 hover:bg-cream",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  danger: "bg-danger text-white hover:bg-[#B91C1C]",
  dark: "bg-ink text-white hover:bg-black",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-10 px-4 text-caption uppercase tracking-[0.1em]",
  md: "h-12 px-6 text-label uppercase tracking-[0.1em]",
  lg: "h-14 px-8 text-label uppercase tracking-[0.1em]",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium cursor-pointer " +
  "transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45 " +
  "disabled:pointer-events-none select-none";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

export type ButtonProps = CommonProps &
  Omit<HTMLMotionProps<"button">, "children" | "className">;

/** Primary action button. Scales to 0.97 on press. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    className,
    children,
    disabled,
    ...props
  },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12 }}
      disabled={disabled || loading}
      className={cn(
        base,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </motion.button>
  );
});

interface ButtonLinkProps extends CommonProps {
  href: string;
  target?: string;
  rel?: string;
  prefetch?: boolean;
  onClick?: () => void;
}

/** Same visual treatment as Button, rendered as a Next link. */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        base,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
