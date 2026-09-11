import type { Metadata } from "next";
import { LegalPage } from "@/components/storefront/LegalPage";
import { getPageSeo } from "@/lib/queries";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("privacy-policy");
  return {
    title: seo?.meta_title ?? "Privacy policy",
    description:
      seo?.meta_description ?? "What we collect, why, and how to have it removed.",
    alternates: { canonical: absoluteUrl("/privacy-policy") },
  };
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      intro="What we collect, why we collect it, and how to have it removed."
      updatedAt="2026-01-15"
      sections={[
        {
          heading: "What we collect",
          body: (
            <>
              <p>
                When you place an order we collect your name, email address, phone
                number and delivery address. When you create an account we also store a
                securely hashed password, or your Google account identifier if you sign
                in that way.
              </p>
              <p>
                We do not see or store your card details. Payments are handled entirely
                by Razorpay, and we only ever receive a payment reference.
              </p>
            </>
          ),
        },
        {
          heading: "Why we collect it",
          body: (
            <p>
              To fulfil your order, handle returns, answer support requests and — if
              you have opted in — send you occasional email. We do not sell your data,
              and we do not share it with anyone beyond the carriers and payment
              processor needed to complete an order.
            </p>
          ),
        },
        {
          heading: "Cookies and analytics",
          body: (
            <p>
              We use a session cookie to keep you signed in and local storage to
              remember your cart between visits. Where analytics are enabled, they are
              used in aggregate to understand which pages are useful — never to build a
              profile of you individually.
            </p>
          ),
        },
        {
          heading: "How long we keep it",
          body: (
            <p>
              Order records are kept for seven years to meet tax and accounting
              obligations. Account details are kept until you ask us to delete them.
              Newsletter subscriptions end the moment you unsubscribe.
            </p>
          ),
        },
        {
          heading: "Your rights",
          body: (
            <p>
              You can ask for a copy of everything we hold about you, ask us to correct
              it, or ask us to delete it. Email us and we will respond within 30 days.
              Deleting your account removes your profile, addresses and wishlist; order
              records are retained in anonymised form where the law requires it.
            </p>
          ),
        },
        {
          heading: "Security",
          body: (
            <p>
              Data is stored with Supabase, encrypted in transit and at rest, with
              row-level access rules that mean one customer cannot read another&rsquo;s
              records. Administrative access is limited to named staff accounts.
            </p>
          ),
        },
      ]}
    />
  );
}
