"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client, memoised so every caller shares one instance.
 *
 * Importing this module statically pulls supabase-js (~196 kB, including a
 * Realtime client this app never uses) into whatever chunk does the
 * importing. That is fine for route-level components — an admin table or the
 * sign-in form cannot work without it anyway.
 *
 * It is NOT fine for anything in the root providers, which would put that
 * weight on every page. AuthContext therefore imports this module lazily; see
 * the note there.
 */
let cached: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (!cached) {
    cached = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return cached;
}
