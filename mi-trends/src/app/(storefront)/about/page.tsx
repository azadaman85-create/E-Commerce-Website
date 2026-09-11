import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { getPageSeo, getSiteSettings } from "@/lib/queries";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("about");
  return {
    title: seo?.meta_title ?? "About us",
    description:
      seo?.meta_description ??
      "How we choose fabrics, the workshops we partner with, and why we make fewer things.",
    alternates: { canonical: absoluteUrl("/about") },
  };
}

const principles = [
  {
    title: "Fewer, better",
    body: "We release a handful of pieces a season rather than a wall of them. Every fabric is sampled, worn and washed before it reaches the shop.",
  },
  {
    title: "Known workshops",
    body: "We work directly with a small number of family-run mills and factories in Japan, Italy and Scotland, and we visit them.",
  },
  {
    title: "Built to be repaired",
    body: "Goodyear welts, replaceable buttons, unfinished hems. Where a thing can be kept going, we make sure it can be.",
  },
];

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <section className="relative h-[52vh] min-h-[380px] w-full overflow-hidden bg-ink">
        <Image
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=2000&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
        <div className="container-page relative flex h-full items-end pb-16">
          <div className="max-w-2xl">
            <span className="text-caption uppercase tracking-[0.1em] text-white/60">
              About
            </span>
            <h1 className="mt-3 font-serif text-hero-sm leading-tight text-white md:text-hero">
              Made to be kept
            </h1>
          </div>
        </div>
      </section>

      <div className="container-page section-y">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-serif text-section-sm leading-tight text-ink">
              We started {settings?.site_name ?? "MI TRENDS"} because buying well had
              become unreasonably hard.
            </h2>
          </div>
          <div className="flex flex-col gap-5 text-body leading-relaxed text-muted">
            <p>
              The wardrobe staples we wanted either cost more than a month&rsquo;s rent
              or fell apart inside a year. Very little sat in between, and almost
              nothing told you where it came from.
            </p>
            <p>
              So we started making the pieces we kept looking for — an oxford in real
              Japanese cotton, a merino crew that survives the wash, a derby that can
              be resoled. We buy the same fabrics the expensive labels use, then sell
              them without the markup that comes from a wholesale chain.
            </p>
            <p>
              We are a small team in Bengaluru. We answer our own emails, and we would
              rather you bought one thing that lasts than four that do not.
            </p>
          </div>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-3">
          {principles.map((principle) => (
            <div key={principle.title} className="card-surface p-8">
              <h3 className="font-serif text-xl text-ink">{principle.title}</h3>
              <p className="mt-4 text-body-sm leading-relaxed text-muted">
                {principle.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col items-center gap-6 rounded-sm bg-cream px-8 py-16 text-center">
          <h2 className="max-w-xl font-serif text-section-sm leading-tight text-ink">
            Have a look at what we make.
          </h2>
          <ButtonLink href="/products" size="lg">
            Shop the collection
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
