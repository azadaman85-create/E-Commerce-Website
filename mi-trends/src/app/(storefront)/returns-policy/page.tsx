import type { Metadata } from "next";
import { LegalPage } from "@/components/storefront/LegalPage";
import { getPageSeo } from "@/lib/queries";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("returns-policy");
  return {
    title: seo?.meta_title ?? "Returns policy",
    description: seo?.meta_description ?? "Thirty-day returns on unworn items.",
    alternates: { canonical: absoluteUrl("/returns-policy") },
  };
}

export default function ReturnsPolicyPage() {
  return (
    <LegalPage
      eyebrow="Policies"
      title="Returns policy"
      intro="Thirty days to change your mind, on unworn items with tags attached."
      updatedAt="2026-01-15"
      sections={[
        {
          heading: "What we accept",
          body: (
            <>
              <p>
                Items can be returned within 30 days of delivery, provided they are
                unworn, unwashed and still have their tags attached, in their original
                packaging.
              </p>
              <p>
                Underwear, socks and anything marked final sale cannot be returned
                unless it arrived faulty.
              </p>
            </>
          ),
        },
        {
          heading: "Starting a return",
          body: (
            <p>
              Open the order in your account and choose Request a return. We will email
              a prepaid label within one business day. Pack the item in its original
              box where you can, attach the label, and hand it to the carrier.
            </p>
          ),
        },
        {
          heading: "Refunds",
          body: (
            <>
              <p>
                Once your return reaches our warehouse we inspect it and refund to the
                original payment method within two business days. Banks typically take
                another 3–5 days to display the credit.
              </p>
              <p>
                Shipping charges are refunded only when the item was faulty or we sent
                the wrong thing.
              </p>
            </>
          ),
        },
        {
          heading: "Exchanges",
          body: (
            <p>
              We do not process direct exchanges — it is faster to return the item for
              a refund and place a new order for the size or colour you want, so the
              stock is reserved for you straight away.
            </p>
          ),
        },
        {
          heading: "Faulty items",
          body: (
            <p>
              If something arrives damaged or develops a fault through normal wear,
              email us with photographs and your order number. We will repair, replace
              or refund it, and we pay the postage.
            </p>
          ),
        },
      ]}
    />
  );
}
