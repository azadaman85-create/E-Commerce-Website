"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** The inline search form on /search, separate from the header modal. */
export function SearchAgain({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [term, setTerm] = useState(initialQuery);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = term.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={submit} className="flex gap-3">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <label htmlFor="search-again" className="sr-only">
          Search products
        </label>
        <input
          id="search-again"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search for products…"
          className="h-14 w-full rounded-sm border border-ink/15 bg-white pl-11 pr-4 text-body-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
        />
      </div>
      <Button type="submit" size="lg">
        Search
      </Button>
    </form>
  );
}
