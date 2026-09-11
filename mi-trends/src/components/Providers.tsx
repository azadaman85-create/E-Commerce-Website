"use client";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ToastProvider } from "@/components/ui/Toast";
import type { SiteSettings } from "@/types";

export function Providers({
  settings,
  children,
}: {
  settings: SiteSettings | null;
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider settings={settings}>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>{children}</CartProvider>
        </ToastProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
