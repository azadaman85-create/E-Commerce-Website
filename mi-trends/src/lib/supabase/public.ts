import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie-free anon client for public catalogue reads.
 *
 * The cookie-bound server client in `server.ts` cannot be used inside
 * `unstable_cache`, because that runs outside the request scope where
 * `cookies()` is available. Products, categories and settings are readable by
 * anon under RLS and identical for every visitor, so they do not need the
 * caller's session at all — which is exactly what makes them cacheable.
 *
 * Anything user-scoped (orders, addresses, wishlist) must keep using the
 * cookie-bound client so RLS still sees who is asking.
 */
let client: ReturnType<typeof createSupabaseClient> | null = null;

export function createPublicClient() {
  if (client) return client;

  client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-application-name": "mi-trends-public" } },
    },
  );

  return client;
}
