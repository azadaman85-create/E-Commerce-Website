import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { ProductPurchasePanel } from "@/components/storefront/ProductPurchasePanel";
import { ProductReviews } from "@/components/storefront/ProductReviews";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { SectionHeading } from "@/components/storefront/SectionHeading";
import { Accordion } from "@/components/ui/Accordion";
import {
  getProductBySlug,
  getProductReviews,
  getRelatedProducts,
  getSiteSettings,
} from "@/lib/queries";
import { absoluteUrl, effectivePrice, stripHtml, truncate } from "@/lib/utils";
import { jsonLd, sanitizeHtml } from "@/lib/sanitize";

// ISR: product pages revalidate every 60s.
export const revalidate = 60;

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Product not found" };

  const description =
    product.meta_description ??
    product.short_description ??
    (product.description ? truncate(stripHtml(product.description), 155) : undefined);

  const image = product.og_image_url ?? product.product_images?.[0]?.image_url;

  return {
    title: product.meta_title ?? product.title,
    description,
    alternates: { canonical: absoluteUrl(`/products/${product.slug}`) },
    openGraph: {
      type: "website",
      title: product.meta_title ?? product.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProductBySlug(params.slug);

  // Drafts are invisible to the public via RLS, so this covers both
  // "missing" and "not published".
  if (!product || product.status !== "active") notFound();

  const [reviewSummary, related, settings] = await Promise.all([
    getProductReviews(product.id),
    getRelatedProducts(product.category_id, product.id, 4),
    getSiteSettings(),
  ]);

  const price = effectivePrice(product);
  const inStock = !product.track_inventory || product.stock_quantity > 0;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.short_description ?? stripHtml(product.description ?? ""),
    image: (product.product_images ?? []).map((img) => img.image_url),
    ...(product.sku ? { sku: product.sku } : {}),
    brand: { "@type": "Brand", name: settings?.site_name ?? "MI TRENDS" },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: settings?.currency_code ?? "INR",
      price: price.toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(reviewSummary.total > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewSummary.average.toFixed(1),
            reviewCount: reviewSummary.total,
          },
        }
      : {}),
  };

  const accordionItems = [
    {
      id: "description",
      title: "Description",
      content: product.description ? (
        <div
          className="prose-mitrends space-y-4 [&_p]:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
        />
      ) : (
        <p>No description available.</p>
      ),
    },
    {
      id: "specifications",
      title: "Specifications",
      content: (
        <table className="w-full text-body-sm">
          <tbody className="divide-y divide-hairline">
            {[
              ["SKU", product.sku ?? "—"],
              ["Category", product.categories?.name ?? "—"],
              [
                "Availability",
                inStock ? `In stock (${product.stock_quantity})` : "Out of stock",
              ],
              ["Tags", product.tags?.length ? product.tags.join(", ") : "—"],
            ].map(([label, value]) => (
              <tr key={label}>
                <th scope="row" className="py-3 pr-6 text-left font-normal text-muted">
                  {label}
                </th>
                <td className="py-3 text-ink">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
    },
    {
      id: "shipping",
      title: "Shipping & Returns",
      content: (
        <div className="space-y-4">
          <p>
            Orders are dispatched within one business day. Standard delivery takes
            4–6 business days and is complimentary on orders over ₹2,000. Express
            and next-day options are available at checkout.
          </p>
          <p>
            Returns are accepted within 30 days of delivery on unworn items with
            tags attached. See our{" "}
            <Link href="/returns-policy" className="text-accent underline underline-offset-4">
              returns policy
            </Link>{" "}
            for the full details.
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productSchema) }}
      />

      <div className="container-page py-8 md:py-12">
        <nav aria-label="Breadcrumb" className="mb-10">
          <ol className="flex flex-wrap items-center gap-2 text-caption normal-case tracking-normal text-muted">
            <li>
              <Link href="/" className="transition-colors hover:text-ink">
                Home
              </Link>
            </li>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <li>
              <Link href="/products" className="transition-colors hover:text-ink">
                Products
              </Link>
            </li>
            {product.categories && (
              <>
                <ChevronRight className="h-3 w-3" aria-hidden />
                <li>
                  <Link
                    href={`/products?category=${product.categories.slug}`}
                    className="transition-colors hover:text-ink"
                  >
                    {product.categories.name}
                  </Link>
                </li>
              </>
            )}
            <ChevronRight className="h-3 w-3" aria-hidden />
            <li aria-current="page" className="text-ink">
              {product.title}
            </li>
          </ol>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div data-pdp-gallery>
            <ProductGallery
              images={product.product_images ?? []}
              title={product.title}
            />
          </div>

          <ProductPurchasePanel
            product={product}
            rating={{
              average: reviewSummary.average,
              count: reviewSummary.total,
            }}
          />
        </div>

        <div className="mt-20 max-w-3xl">
          <Accordion items={accordionItems} defaultOpen="description" />
        </div>

        <div className="mt-20 md:mt-30">
          <ProductReviews
            productId={product.id}
            reviews={reviewSummary.reviews}
            average={reviewSummary.average}
            total={reviewSummary.total}
            breakdown={reviewSummary.breakdown}
          />
        </div>

        {related.length > 0 && (
          <div className="mt-20 md:mt-30">
            <SectionHeading
              eyebrow="You may also like"
              title="Related products"
              href="/products"
            />
            <ProductGrid products={related} priorityCount={0} />
          </div>
        )}
      </div>
    </>
  );
}
