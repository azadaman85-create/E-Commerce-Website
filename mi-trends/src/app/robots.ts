import type { MetadataRoute } from "next";
import { getSeoSettings } from "@/lib/queries";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 3600;

/**
 * Reads the robots.txt body from /admin/seo and always appends the sitemap
 * line, so an admin cannot accidentally drop it.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeoSettings();
  const custom = seo?.robots_txt?.trim();

  if (custom) {
    const disallow = custom
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.toLowerCase().startsWith("disallow:"))
      .map((line) => line.slice("disallow:".length).trim())
      .filter(Boolean);

    return {
      rules: { userAgent: "*", allow: "/", disallow },
      sitemap: absoluteUrl("/sitemap.xml"),
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/checkout", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
