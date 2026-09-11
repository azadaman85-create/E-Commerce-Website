import type { Metadata } from "next";
import { LegalPage } from "@/components/storefront/LegalPage";
import { getPageSeo } from "@/lib/queries";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("shipping-policy");
  return {
    title: seo?.meta_title ?? "Shipping policy",
    description: seo?.meta_description ?? "Delivery timelines, costs and tracking.",
    alternates: { canonical: absoluteUrl("/shipping-policy") },
  };
}

export default function ShippingPolicyPage() {
  return (
    <LegalPage
      eyebrow="Policies"
      title="Shipping policy"
      intro="Where we ship, how long it takes, and what it costs."
      updatedAt="2026-01-15"
      sections={[
        {
          heading: "Processing time",
          body: (
            <>
              <p>
                Orders placed before 2pm IST on a business day are dispatched the same
                day. Anything after that, or on a weekend or public holiday, goes out
                on the next business day.
              </p>
              <p>
                During sale periods processing can take an extra day. We will say so on
                the product page if that is the case.
              </p>
            </>
          ),
        },
        {
          heading: "Delivery times and cost",
          body: (
            <>
              <p>
                Standard delivery takes 4–6 business days and costs ₹99, or nothing at
                all on orders over ₹2,000. Express takes 2–3 business days at ₹249.
                Next-day delivery is ₹499 and is available in most metro pin codes.
              </p>
              <p>
                Timelines are counted from dispatch, not from when you place the order.
              </p>
            </>
          ),
        },
        {
          heading: "Tracking",
          body: (
            <p>
              As soon as your parcel is collected you will get an email with a tracking
              number, and it appears on the order page in your account. If tracking has
              not moved in 48 hours, tell us and we will chase the carrier.
            </p>
          ),
        },
        {
          heading: "Undeliverable parcels",
          body: (
            <p>
              Carriers attempt delivery twice before returning a parcel to us. If that
              happens we will contact you to arrange redelivery; a second dispatch is
              charged at the standard rate.
            </p>
          ),
        },
        {
          heading: "International shipping",
          body: (
            <p>
              We currently ship within India only. International delivery is planned,
              and joining the newsletter is the quickest way to hear when it opens.
            </p>
          ),
        },
      ]}
    />
  );
}
