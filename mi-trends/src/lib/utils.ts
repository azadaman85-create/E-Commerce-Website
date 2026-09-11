import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  symbol = "₹",
  code = "INR",
): string {
  const locale = code === "INR" ? "en-IN" : "en-US";
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
  return `${symbol}${formatted}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatDate(value: string | Date, withTime = false): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

/** Rounds to 2dp without floating-point drift (0.1 + 0.2 style errors). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** A product is on sale only when sale_price is set AND we are inside the window. */
export function isOnSale(product: {
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
  price: number;
}): boolean {
  if (product.sale_price === null || product.sale_price >= product.price) {
    return false;
  }
  const now = Date.now();
  if (product.sale_start && new Date(product.sale_start).getTime() > now) {
    return false;
  }
  if (product.sale_end && new Date(product.sale_end).getTime() < now) {
    return false;
  }
  return true;
}

export function effectivePrice(product: {
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
  price: number;
}): number {
  return isOnSale(product) ? (product.sale_price as number) : product.price;
}

export function discountPercent(price: number, salePrice: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

export function truncate(text: string, length = 120): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}…`;
}

/** Strips HTML for meta descriptions and card excerpts. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function cartItemKey(productId: string, variantId: string | null) {
  return variantId ? `${productId}::${variantId}` : productId;
}

export function absoluteUrl(path = ""): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Serialises a partial filter state into URLSearchParams, dropping empties. */
export function buildSearchParams(
  params: Record<string, string | number | string[] | null | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      search.set(key, value.join(","));
    } else {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

export function parseListParam(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.map(csvEscape).join(",");
  const body = rows
    .map((row) => columns.map((col) => csvEscape(row[col])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}
