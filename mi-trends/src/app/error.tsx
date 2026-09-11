"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in the server logs / error reporting with the digest attached.
    console.error("Unhandled application error", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="label-caps">Something went wrong</span>
      <h1 className="mt-4 font-serif text-section leading-tight text-ink">
        We hit an unexpected error
      </h1>
      <p className="mt-6 max-w-md text-body leading-relaxed text-muted">
        This one is on us. Try again — if it keeps happening, get in touch and we
        will look into it.
      </p>

      {error.digest && (
        <p className="mt-4 text-caption normal-case tracking-normal text-muted/70">
          Reference: {error.digest}
        </p>
      )}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset} size="lg">
          Try again
        </Button>
        <ButtonLink href="/" variant="secondary" size="lg">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
