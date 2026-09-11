import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendShippingNotification } from "@/lib/email/notify";

const schema = z.object({ orderId: z.string().uuid() });

/**
 * Sends the "your order has shipped" email.
 *
 * The admin panel writes tracking details straight to Supabase, which cannot
 * send mail, so this is the server-side companion it calls afterwards. Admin
 * only — otherwise anyone could spray shipping notices at customers.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as { role?: string } | null)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 403 });
  }

  await sendShippingNotification(parsed.data.orderId);

  return NextResponse.json({ ok: true });
}
