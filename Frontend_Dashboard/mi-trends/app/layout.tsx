import type { Metadata, Viewport } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";
import { StoreProvider } from "@/components/StoreProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SearchOverlay from "@/components/SearchOverlay";
import MobileNav from "@/components/MobileNav";
import MobileTabBar from "@/components/MobileTabBar";
import Toast from "@/components/Toast";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#171716",
};

export const metadata: Metadata = {
  title: {
    default: "MI TRENDS — Made to be noticed",
    template: "%s | MI TRENDS",
  },
  description:
    "Original streetwear, graphic essentials and everyday statement pieces designed in India.",
  referrer: "no-referrer",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
          <CartDrawer />
          <SearchOverlay />
          <MobileNav />
          <MobileTabBar />
          <Toast />
        </StoreProvider>
      </body>
    </html>
  );
}
