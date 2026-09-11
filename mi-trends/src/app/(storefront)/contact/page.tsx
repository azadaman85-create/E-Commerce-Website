import type { Metadata } from "next";
import { ContactForm } from "@/components/storefront/ContactForm";
import { getPageSeo, getSiteSettings } from "@/lib/queries";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("contact");
  return {
    title: seo?.meta_title ?? "Contact",
    description:
      seo?.meta_description ??
      "Questions about an order, sizing or a return? We answer within one business day.",
    alternates: { canonical: absoluteUrl("/contact") },
  };
}

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div className="container-page py-12 md:py-16">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <span className="label-caps">Contact</span>
          <h1 className="mt-3 font-serif text-section-sm leading-tight text-ink md:text-section">
            Talk to a person
          </h1>
          <p className="mt-6 max-w-md text-body leading-relaxed text-muted">
            Order questions, sizing advice, returns — we answer every message within
            one business day, usually sooner.
          </p>

          <dl className="mt-12 flex flex-col gap-8">
            {settings?.contact_email && (
              <div>
                <dt className="label-caps">Email</dt>
                <dd className="mt-2">
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="text-body text-accent underline underline-offset-4"
                  >
                    {settings.contact_email}
                  </a>
                </dd>
              </div>
            )}

            {settings?.contact_phone && (
              <div>
                <dt className="label-caps">Phone</dt>
                <dd className="mt-2">
                  <a
                    href={`tel:${settings.contact_phone.replace(/\s/g, "")}`}
                    className="text-body text-ink"
                  >
                    {settings.contact_phone}
                  </a>
                </dd>
              </div>
            )}

            {settings?.business_address && (
              <div>
                <dt className="label-caps">Address</dt>
                <dd className="mt-2 text-body leading-relaxed text-muted">
                  {settings.business_address}
                </dd>
              </div>
            )}

            <div>
              <dt className="label-caps">Hours</dt>
              <dd className="mt-2 text-body leading-relaxed text-muted">
                Monday to Friday, 10am–6pm IST
              </dd>
            </div>
          </dl>
        </div>

        <div className="card-surface p-8 md:p-10">
          <h2 className="font-serif text-2xl text-ink">Send a message</h2>
          <div className="mt-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
