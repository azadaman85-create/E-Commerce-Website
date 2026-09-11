import type { Metadata } from "next";
import Link from "next/link";
import { Accordion } from "@/components/ui/Accordion";
import { ButtonLink } from "@/components/ui/Button";
import { getPageSeo } from "@/lib/queries";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("faq");
  return {
    title: seo?.meta_title ?? "Frequently asked questions",
    description:
      seo?.meta_description ?? "Sizing, shipping, returns and care — answered.",
    alternates: { canonical: absoluteUrl("/faq") },
  };
}

const faqs = [
  {
    q: "How do I choose a size?",
    a: "Every product page lists measurements taken flat, garment by garment. Our knitwear and shirting run true to size; the outerwear is cut with room for a midweight layer. If you are between sizes, size down in knitwear and up in outerwear.",
  },
  {
    q: "When will my order ship?",
    a: "Orders placed before 2pm IST on a business day are dispatched the same day; everything else goes out the next. Standard delivery takes 4–6 business days, express 2–3, and next-day is available in most metros.",
  },
  {
    q: "Is shipping free?",
    a: "Standard shipping is complimentary on orders over ₹2,000. Below that it is ₹99. Express and next-day are charged at cost and shown at checkout.",
  },
  {
    q: "Can I return something?",
    a: "Yes — within 30 days of delivery, on unworn items with tags attached. Start a return from your account's order page and we will email a prepaid label.",
  },
  {
    q: "How long do refunds take?",
    a: "We refund to the original payment method within two business days of the return arriving. Your bank usually takes another 3–5 days to show it.",
  },
  {
    q: "Do you ship internationally?",
    a: "Not yet. We ship across India today, and we are working on a handful of international destinations for next year.",
  },
  {
    q: "How should I care for merino and cashmere?",
    a: "Wash on a wool cycle at 30°C with a wool detergent, or hand wash cold. Never tumble dry — reshape while damp and dry flat. Between wears, airing is usually enough.",
  },
  {
    q: "Can I change or cancel an order?",
    a: "If it has not shipped, yes. Email us with your order number as soon as you can and we will catch it if we can.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "All major cards, UPI, net banking and the usual wallets, handled by Razorpay. Card details are entered on Razorpay's own secure form and never reach our servers.",
  },
];

export default function FaqPage() {
  // FAQPage structured data so these can surface as rich results.
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="container-page py-12 md:py-16">
        <header className="max-w-2xl">
          <span className="label-caps">Help</span>
          <h1 className="mt-3 font-serif text-section-sm leading-tight text-ink md:text-section">
            Frequently asked questions
          </h1>
          <p className="mt-6 text-body leading-relaxed text-muted">
            Sizing, shipping, returns and care. If something is not covered here,{" "}
            <Link href="/contact" className="text-accent underline underline-offset-4">
              send us a message
            </Link>
            .
          </p>
        </header>

        <div className="mt-16 max-w-3xl">
          <Accordion
            items={faqs.map((faq, i) => ({
              id: `faq-${i}`,
              title: faq.q,
              content: <p>{faq.a}</p>,
            }))}
            defaultOpen="faq-0"
            allowMultiple
          />
        </div>

        <div className="mt-16 flex flex-col items-center gap-6 rounded-sm bg-cream px-8 py-14 text-center">
          <h2 className="font-serif text-2xl text-ink">Still need a hand?</h2>
          <ButtonLink href="/contact">Contact us</ButtonLink>
        </div>
      </div>
    </>
  );
}
