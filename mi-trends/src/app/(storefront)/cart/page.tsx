import type { Metadata } from "next";
import { CartPageClient } from "@/components/storefront/CartPageClient";
import { getShippingMethods, getSiteSettings } from "@/lib/queries";
import { DEFAULT_SETTINGS } from "@/context/SettingsContext";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the items in your cart.",
  robots: { index: false },
};

export default async function CartPage() {
  const [shippingMethods, settings] = await Promise.all([
    getShippingMethods(),
    getSiteSettings(),
  ]);

  return (
    <CartPageClient
      shippingMethods={shippingMethods}
      settings={settings ?? DEFAULT_SETTINGS}
    />
  );
}
