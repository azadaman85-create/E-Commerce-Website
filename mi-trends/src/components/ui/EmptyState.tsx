import { cn } from "@/lib/utils";

interface EmptyStateProps {
  illustration?: "cart" | "search" | "wishlist" | "orders" | "box";
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Hand-drawn line illustrations. Kept as inline SVG so they inherit the
 * text colour and add nothing to the bundle.
 */
function Illustration({ kind }: { kind: NonNullable<EmptyStateProps["illustration"]> }) {
  const common = {
    className: "h-28 w-28 text-ink/15",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.25,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 96 96",
    "aria-hidden": true,
  };

  switch (kind) {
    case "cart":
      return (
        <svg {...common}>
          <path d="M14 20h8l8 40h40l8-28H30" />
          <circle cx="36" cy="74" r="5" />
          <circle cx="66" cy="74" r="5" />
          <path d="M48 30v14M41 37h14" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="42" cy="42" r="22" />
          <path d="M58 58l20 20" />
          <path d="M34 42h16" />
        </svg>
      );
    case "wishlist":
      return (
        <svg {...common}>
          <path d="M48 76S18 58 18 38a14 14 0 0 1 26-7 14 14 0 0 1 26 7c0 20-30 38-30 38z" />
        </svg>
      );
    case "orders":
      return (
        <svg {...common}>
          <path d="M26 18h44v60H26z" />
          <path d="M36 34h24M36 46h24M36 58h14" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M16 32l32-14 32 14-32 14z" />
          <path d="M16 32v32l32 14 32-14V32" />
          <path d="M48 46v32" />
        </svg>
      );
  }
}

export function EmptyState({
  illustration = "box",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-20 text-center",
        className,
      )}
    >
      <Illustration kind={illustration} />
      <h3 className="mt-8 font-serif text-2xl text-ink">{title}</h3>
      {description && (
        <p className="mt-3 max-w-sm text-body-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
