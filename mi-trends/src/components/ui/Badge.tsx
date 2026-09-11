import { cn } from "@/lib/utils";
import type { FulfillmentStatus, PaymentStatus } from "@/types";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-ink/5 text-muted",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-[#F59E0B]/12 text-[#B45309]",
  danger: "bg-danger/10 text-danger",
  info: "bg-[#0EA5E9]/10 text-[#0369A1]",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-caption font-medium uppercase tracking-[0.1em]",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const fulfillmentTone: Record<FulfillmentStatus, Tone> = {
  pending: "warning",
  processing: "info",
  shipped: "accent",
  delivered: "success",
  cancelled: "danger",
};

const paymentTone: Record<PaymentStatus, Tone> = {
  pending: "warning",
  paid: "success",
  failed: "danger",
  refunded: "neutral",
};

export function FulfillmentBadge({ status }: { status: FulfillmentStatus }) {
  return <Badge tone={fulfillmentTone[status] ?? "neutral"}>{status}</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={paymentTone[status] ?? "neutral"}>{status}</Badge>;
}
