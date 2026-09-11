"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Safe to call repeatedly — createBrowserClient
 * memoises the underlying instance per set of credentials.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
