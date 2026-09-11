"use client";

import { createContext, useContext } from "react";
import type { SiteSettings } from "@/types";

/** Fallback used before settings exist in the database. */
export const DEFAULT_SETTINGS: SiteSettings = {
  id: "default",
  site_name: "MI TRENDS",
  tagline: "Considered essentials for the modern wardrobe.",
  logo_url: null,
  logo_inverted_url: null,
  favicon_url: null,
  contact_email: "hello@mitrends.com",
  contact_phone: null,
  business_address: null,
  currency_code: "INR",
  currency_symbol: "₹",
  tax_rate: 18,
  tax_inclusive: false,
  announcement_bar_active: false,
  announcement_bar_text: null,
  announcement_bar_link: null,
  announcement_bar_color: "#1A1A1A",
  social_instagram: null,
  social_facebook: null,
  social_twitter: null,
  social_tiktok: null,
  social_youtube: null,
  sale_active: false,
  sale_headline: null,
  sale_ends_at: null,
  updated_at: new Date().toISOString(),
};

const SettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS);

export function SettingsProvider({
  settings,
  children,
}: {
  settings: SiteSettings | null;
  children: React.ReactNode;
}) {
  return (
    <SettingsContext.Provider value={settings ?? DEFAULT_SETTINGS}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

/** Convenience: currency formatter already bound to the store's currency. */
export function useCurrency() {
  const settings = useSettings();
  return (amount: number) => {
    const locale = settings.currency_code === "INR" ? "en-IN" : "en-US";
    return `${settings.currency_symbol}${new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0)}`;
  };
}
