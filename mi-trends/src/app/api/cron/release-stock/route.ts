import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Orders unpaid for longer than this are swept and their stock returned. */
const ABANDON_MINUTES = 30;

/**
 * Releases stock held by abandoned checkouts.
 *
 * Stock is reserved when an order is created, which is what prevents two
 * people buying the last item at once. This is the other half: without it, a
 * customer who opens the payment window and walks away holds that stock
 * forever, and the item reads as sold out while nobody has paid for it.
 *
 * Point a scheduler at this every 10-15 minutes. On Vercel, add to vercel.json:
 *
 *   { "crons": [{ "path": "/api/cron/release-stock", "schedule": "*\/15 * * * *" }] }
 *
 * Vercel sends its own Authorization header built from CRON_SECRET; any other
 * caller must present it as `x-cron-secret`.
 */
async function sweep(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const header =
      request.headers.get("x-cron-secret") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (header !== secret) {
      return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Refuse to run unauthenticated in production rather than expose a public
    // endpoint that mutates orders.
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("release_abandoned_orders", {
    p_minutes: ABANDON_MINUTES,
  });

  if (error) {
    console.error("Stock release sweep failed", error);
    return NextResponse.json(
      {
        error:
          "Sweep failed. Has migration 0006_stock_release.sql been applied?",
        detail: error.message,
      },
      { status: 500 },
    );
  }

  const released = Number(data ?? 0);
  if (released > 0) {
    console.log(`[stock] released ${released} abandoned order(s)`);
  }

  return NextResponse.json({
    released,
    abandonedAfterMinutes: ABANDON_MINUTES,
    ranAt: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  return sweep(request);
}

// Most schedulers POST; Vercel Cron issues a GET.
export async function POST(request: Request) {
  return sweep(request);
}
