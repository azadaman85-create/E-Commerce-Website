"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Advances the `page` search param, which widens the server-side result
 * window. Keeps the URL shareable and the results server-rendered.
 */
export function LoadMore({
  nextPage,
  remaining,
}: {
  nextPage: number;
  remaining: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const loadMore = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="mt-16 flex flex-col items-center gap-4">
      <p className="text-caption normal-case tracking-normal text-muted">
        {remaining} more product{remaining === 1 ? "" : "s"}
      </p>
      <motion.button
        type="button"
        onClick={loadMore}
        disabled={isPending}
        whileTap={{ scale: 0.97 }}
        className="flex h-14 cursor-pointer items-center gap-2 rounded-sm border border-ink/15 px-10 text-label uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {isPending ? "Loading" : "Load more"}
      </motion.button>
    </div>
  );
}
