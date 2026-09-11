import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { getSeoSettings, getSiteSettings } from "@/lib/queries";
import { absoluteUrl } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [settings, seo] = await Promise.all([getSiteSettings(), getSeoSettings()]);

  const siteName = settings?.site_name ?? "MI TRENDS";
  const description =
    seo?.default_meta_description ??
    settings?.tagline ??
    "Considered essentials, made to last.";

  return {
    metadataBase: new URL(absoluteUrl()),
    title: {
      default: siteName,
      template: (seo?.meta_title_template ?? "{page} | {site}")
        .replace("{page}", "%s")
        .replace("{site}", siteName),
    },
    description,
    icons: settings?.favicon_url ? { icon: settings.favicon_url } : undefined,
    openGraph: {
      type: "website",
      siteName,
      title: siteName,
      description,
      images: seo?.og_default_image_url ? [seo.og_default_image_url] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
    },
    ...(seo?.search_console_meta
      ? { verification: { google: seo.search_console_meta } }
      : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#FAFAFA",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, seo] = await Promise.all([getSiteSettings(), getSeoSettings()]);

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <Providers settings={settings}>{children}</Providers>

        {/* Analytics tags are configured from /admin/seo. */}
        {seo?.ga_tracking_id && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${seo.ga_tracking_id}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${seo.ga_tracking_id}');`,
              }}
            />
          </>
        )}
        {seo?.fb_pixel_id && (
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${seo.fb_pixel_id}');fbq('track','PageView');`,
            }}
          />
        )}
      </body>
    </html>
  );
}
