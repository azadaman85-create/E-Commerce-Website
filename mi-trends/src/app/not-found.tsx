import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="label-caps">Error 404</span>
      <h1 className="mt-4 font-serif text-hero-sm leading-tight text-ink md:text-hero">
        This page has moved on
      </h1>
      <p className="mt-6 max-w-md text-body leading-relaxed text-muted">
        The link may be out of date, or the product may have sold through. The
        collection is still where you left it.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/" size="lg">
          Back to home
        </ButtonLink>
        <ButtonLink href="/products" variant="secondary" size="lg">
          Browse products
        </ButtonLink>
      </div>

      <Link
        href="/contact"
        className="mt-10 text-caption normal-case tracking-normal text-muted underline underline-offset-4 transition-colors hover:text-ink"
      >
        Think something is broken? Tell us.
      </Link>
    </div>
  );
}
