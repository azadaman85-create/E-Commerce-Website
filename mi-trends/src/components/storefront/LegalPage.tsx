import Link from "next/link";
import { formatDate } from "@/lib/utils";

export interface LegalSection {
  heading: string;
  body: React.ReactNode;
}

/** Shared shell for the policy pages so they stay visually consistent. */
export function LegalPage({
  eyebrow,
  title,
  intro,
  updatedAt,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <div className="container-page py-12 md:py-16">
      <header className="max-w-2xl">
        <span className="label-caps">{eyebrow}</span>
        <h1 className="mt-3 font-serif text-section-sm leading-tight text-ink md:text-section">
          {title}
        </h1>
        <p className="mt-6 text-body leading-relaxed text-muted">{intro}</p>
        <p className="mt-4 text-caption normal-case tracking-normal text-muted">
          Last updated {formatDate(updatedAt)}
        </p>
      </header>

      <div className="mt-16 grid gap-12 lg:grid-cols-[220px_1fr] lg:gap-16">
        <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
          <span className="label-caps">Contents</span>
          <ul className="mt-4 flex flex-col gap-3">
            {sections.map((section, i) => (
              <li key={section.heading}>
                <a
                  href={`#section-${i}`}
                  className="text-body-sm text-muted transition-colors hover:text-ink"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="max-w-prose">
          {sections.map((section, i) => (
            <section key={section.heading} id={`section-${i}`} className="scroll-mt-24 pb-12">
              <h2 className="font-serif text-2xl text-ink">{section.heading}</h2>
              <div className="mt-4 flex flex-col gap-4 text-body-sm leading-relaxed text-muted">
                {section.body}
              </div>
            </section>
          ))}

          <div className="border-t border-hairline pt-8">
            <p className="text-body-sm text-muted">
              Questions about this policy?{" "}
              <Link href="/contact" className="text-accent underline underline-offset-4">
                Get in touch
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
