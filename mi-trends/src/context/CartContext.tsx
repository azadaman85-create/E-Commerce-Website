"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CartItem } from "@/types";
import { cartItemKey, round2 } from "@/lib/utils";

const STORAGE_KEY = "mitrends.cart.v1";

interface AddItemInput {
  productId: string;
  variantId?: string | null;
  slug: string;
  title: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity?: number;
  maxQuantity: number;
  variantInfo?: CartItem["variantInfo"];
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  hydrated: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (input: AddItemInput, sourceEl?: HTMLElement | null) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  /** Registers the header cart icon so the flying ghost knows where to land. */
  registerCartTarget: (el: HTMLElement | null) => void;
  /** Increments on every add — the header badge animates off this. */
  bumpToken: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Defensive: drop anything that does not look like a cart line.
    return parsed.filter(
      (item): item is CartItem =>
        typeof item?.key === "string" &&
        typeof item?.productId === "string" &&
        typeof item?.unitPrice === "number" &&
        typeof item?.quantity === "number",
    );
  } catch {
    return [];
  }
}

/**
 * Clones the source image and animates it along a bezier arc to the cart
 * icon. Pure DOM + Web Animations API — cheaper than mounting a React
 * portal for something that lives for 700ms.
 */
function flyToCart(source: HTMLElement, target: HTMLElement) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (from.width === 0 || to.width === 0) return;

  const ghost = source.cloneNode(true) as HTMLElement;
  ghost.style.position = "fixed";
  ghost.style.left = `${from.left}px`;
  ghost.style.top = `${from.top}px`;
  ghost.style.width = `${from.width}px`;
  ghost.style.height = `${from.height}px`;
  ghost.style.margin = "0";
  ghost.style.zIndex = "200";
  ghost.style.pointerEvents = "none";
  ghost.style.borderRadius = "2px";
  ghost.style.objectFit = "cover";
  ghost.style.willChange = "transform, opacity";
  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);

  const animation = ghost.animate(
    [
      { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 1 },
      {
        // Arc: travel most of the horizontal distance while lifting upward.
        transform: `translate(${dx * 0.55}px, ${dy * 0.25 - 90}px) scale(0.62) rotate(6deg)`,
        opacity: 0.9,
        offset: 0.55,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(0.2) rotate(10deg)`,
        opacity: 0,
      },
    ],
    { duration: 750, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" },
  );

  animation.onfinish = () => ghost.remove();
  animation.oncancel = () => ghost.remove();
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [bumpToken, setBumpToken] = useState(0);
  const cartTargetRef = useRef<HTMLElement | null>(null);

  // Hydrate from localStorage after mount so SSR and first paint agree.
  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Quota exceeded or storage disabled — the cart still works in-memory.
    }
  }, [items, hydrated]);

  // Keep the cart in sync across tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStoredCart());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const registerCartTarget = useCallback((el: HTMLElement | null) => {
    cartTargetRef.current = el;
  }, []);

  const addItem = useCallback((input: AddItemInput, sourceEl?: HTMLElement | null) => {
    const key = cartItemKey(input.productId, input.variantId ?? null);
    const quantity = Math.max(1, input.quantity ?? 1);

    setItems((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) =>
          item.key === key
            ? {
                ...item,
                // Never let the cart exceed available stock.
                quantity: Math.min(item.quantity + quantity, input.maxQuantity),
                unitPrice: input.unitPrice,
                maxQuantity: input.maxQuantity,
              }
            : item,
        );
      }
      return [
        ...prev,
        {
          key,
          productId: input.productId,
          variantId: input.variantId ?? null,
          slug: input.slug,
          title: input.title,
          imageUrl: input.imageUrl,
          unitPrice: input.unitPrice,
          quantity: Math.min(quantity, input.maxQuantity),
          maxQuantity: input.maxQuantity,
          variantInfo: input.variantInfo ?? [],
        },
      ];
    });

    setBumpToken((t) => t + 1);

    if (sourceEl && cartTargetRef.current) {
      flyToCart(sourceEl, cartTargetRef.current);
    }
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.key !== key) return [item];
        const next = Math.min(Math.max(1, quantity), item.maxQuantity);
        return [{ ...item, quantity: next }];
      }),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const { itemCount, subtotal } = useMemo(() => {
    let count = 0;
    let sum = 0;
    for (const item of items) {
      count += item.quantity;
      sum += item.unitPrice * item.quantity;
    }
    return { itemCount: count, subtotal: round2(sum) };
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
      hydrated,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      registerCartTarget,
      bumpToken,
    }),
    [
      items,
      itemCount,
      subtotal,
      hydrated,
      isOpen,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      registerCartTarget,
      bumpToken,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
