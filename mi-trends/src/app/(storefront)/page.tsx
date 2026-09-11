import type { Metadata } from "next";
import { Hero } from "@/components/storefront/Hero";
import { SectionHeading } from "@/components/storefront/SectionHeading";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { CategoryRow } from "@/components/storefront/CategoryRow";
import { GenderSplit } from "@/components/storefront/GenderSplit";
import { PromoBanner } from "@/components/storefront/PromoBanner";
import { PromoBanners } from "@/components/storefront/PromoBanners";
import { Testimonials, TrustBadges } from "@/components/storefront/Testimonials";
import { SocialFeed } from "@/components/storefront/SocialFeed";
import { NewsletterSection } from "@/components/storefront/NewsletterSection";
import {
  getActiveBanners,
  getBestSellers,
  getCategories,
  getHeroSlides,
  getNewArrivals,
  getPageSeo,
  getRatingsFor,
  getSiteSettings,
  getSocialPosts,
  getTestimonials,
} from "@/lib/queries";
import { absoluteUrl } from "@/lib/utils";
import { jsonLd } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getPageSeo("home"), getSiteSettings()]);
  return {
    // `absolute` opts out of the parent title template — the homepage title
    // is the site name, not "MI TRENDS | MI TRENDS".
    title: {
      absolute: seo?.meta_title ?? settings?.site_name ?? "MI TRENDS",
    },
    description: seo?.meta_description ?? settings?.tagline ?? undefined,
    openGraph: seo?.og_image_url ? { images: [seo.og_image_url] } : undefined,
    alternates: { canonical: absoluteUrl("/") },
  };
}

export default async function HomePage() {
  const [
    slides,
    categories,
    newArrivals,
    bestSellers,
    mensPicks,
    womensPicks,
    testimonials,
    socialPosts,
    banners,
    settings,
  ] = await Promise.all([
    getHeroSlides(),
    getCategories(),
    getNewArrivals(8),
    getBestSellers(4),
    getBestSellers(4, "men"),
    getBestSellers(4, "women"),
    getTestimonials(),
    getSocialPosts(),
    getActiveBanners(),
    getSiteSettings(),
  ]);

  const ratingMap = await getRatingsFor([
    ...new Set(
      [...newArrivals, ...bestSellers, ...mensPicks, ...womensPicks].map((p) => p.id),
    ),
  ]);
  const ratings = Object.fromEntries(ratingMap);

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings?.site_name ?? "MI TRENDS",
    url: absoluteUrl("/"),
    ...(settings?.logo_url ? { logo: settings.logo_url } : {}),
    ...(settings?.contact_email
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            email: settings.contact_email,
            contactType: "customer service",
          },
        }
      : {}),
    sameAs: [
      settings?.social_instagram,
      settings?.social_facebook,
      settings?.social_twitter,
      settings?.social_youtube,
    ].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(orgSchema) }}
      />

      <Hero slides={slides} />

      {/* The two main ways into the store. */}
      <section className="container-page section-y">
        <SectionHeading
          eyebrow="Shop by section"
          title="Men & Women"
          description="Two ranges, built on the same fabrics and the same standards."
          href="/products"
          linkLabel="See everything"
        />
        <GenderSplit />
      </section>

      <TrustBadges />

      <section className="container-page section-y">
        <SectionHeading
          eyebrow="Browse"
          title="Shop by category"
          description="Seven edits, each built around fabrics we would wear ourselves."
          href="/products"
        />
        <CategoryRow categories={categories} />
      </section>

      <section className="container-page section-y">
        <SectionHeading
          eyebrow="Just landed"
          title="New arrivals"
          description="The latest additions across both collections."
          href="/products?sort=newest"
        />
        <ProductGrid products={newArrivals} ratings={ratings} priorityCount={4} />
      </section>

      <PromoBanner />

      {banners.length > 0 && (
        <section className="container-page section-y">
          <PromoBanners banners={banners} />
        </section>
      )}

      <section className="container-page section-y">
        <SectionHeading
          eyebrow="Men"
          title="Favourites from the men's range"
          href="/men"
          linkLabel="Shop men"
        />
        <ProductGrid products={mensPicks} ratings={ratings} priorityCount={0} />
      </section>

      <section className="container-page section-y">
        <SectionHeading
          eyebrow="Women"
          title="Favourites from the women's range"
          href="/women"
          linkLabel="Shop women"
        />
        <ProductGrid products={womensPicks} ratings={ratings} priorityCount={0} />
      </section>

      <section className="container-page section-y">
        <SectionHeading
          eyebrow="Loved most"
          title="Best sellers"
          description="The pieces our customers come back for."
          href="/products?sort=best-selling"
        />
        <ProductGrid products={bestSellers} ratings={ratings} priorityCount={0} />
      </section>

      <section className="container-page section-y">
        <SectionHeading eyebrow="In their words" title="What customers say" />
        <Testimonials testimonials={testimonials} />
      </section>

      <section className="container-page section-y">
        <SectionHeading
          eyebrow="@mitrends"
          title="From the feed"
          href={settings?.social_instagram ?? "/products"}
          linkLabel="Follow us"
        />
        <SocialFeed posts={socialPosts} />
      </section>

      <div className="pb-20 md:pb-30">
        <NewsletterSection />
      </div>
    </>
  );
}
