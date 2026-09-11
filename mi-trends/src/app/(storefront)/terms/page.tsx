import type { Metadata } from "next";
import { LegalPage } from "@/components/storefront/LegalPage";
import { getPageSeo } from "@/lib/queries";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("terms");
  return {
    title: seo?.meta_title ?? "Terms of service",
    description:
      seo?.meta_description ?? "The terms that govern use of this store.",
    alternates: { canonical: absoluteUrl("/terms") },
  };
}

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of service"
      intro="The terms you agree to when you shop with us."
      updatedAt="2026-01-15"
      sections={[
        {
          heading: "Using this site",
          body: (
            <p>
              By browsing or ordering from this store you agree to these terms. You
              must be old enough to enter a binding contract in your jurisdiction. You
              agree not to interfere with the site, scrape it at volume, or use it for
              anything unlawful.
            </p>
          ),
        },
        {
          heading: "Your account",
          body: (
            <p>
              You are responsible for keeping your password secure and for activity
              that happens under your account. Tell us straight away if you think
              someone else has access. We may suspend accounts we reasonably believe
              are being used fraudulently.
            </p>
          ),
        },
        {
          heading: "Orders and pricing",
          body: (
            <>
              <p>
                An order is an offer to buy, which we accept when we dispatch it. We
                may decline an order — for example where an item has sold out or a
                price was listed in error — and we will refund you in full if we do.
              </p>
              <p>
                Prices include applicable taxes where stated. Delivery charges are
                shown separately at checkout before you pay.
              </p>
            </>
          ),
        },
        {
          heading: "Stock and product information",
          body: (
            <p>
              We do our best to describe products accurately and to photograph colours
              faithfully, but screens vary. Stock levels are shown in good faith; if
              something sells out between your order and our picking it, we will
              contact you and refund that line.
            </p>
          ),
        },
        {
          heading: "Liability",
          body: (
            <p>
              Nothing here limits liability for death, personal injury or fraud. Beyond
              that, our liability for any order is limited to the amount you paid for
              it. We are not liable for indirect or consequential loss.
            </p>
          ),
        },
        {
          heading: "Changes and governing law",
          body: (
            <p>
              We may update these terms; the version in force is the one published when
              you place your order. These terms are governed by the laws of India, and
              the courts of Bengaluru have exclusive jurisdiction.
            </p>
          ),
        },
      ]}
    />
  );
}
