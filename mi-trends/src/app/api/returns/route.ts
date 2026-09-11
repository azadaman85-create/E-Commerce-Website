import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkReturnEligibility } from "@/lib/returns";
import { round2 } from "@/lib/utils";
import type { OrderWithItems, ReturnItem } from "@/types";

const schema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(1).max(120),
  comment: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        orderItemId: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1),
});

/**
 * Opens a return request.
 *
 * Eligibility and the refund amount are both decided here from the stored
 * order — the client only says which lines it wants to send back.
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
    return NextResponse.json(
      { error: "Please choose at least one item and a reason." },
      { status: 400 },
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to request a return." },
      { status: 401 },
    );
  }

  // RLS already scopes this to the caller's own orders.
  const { data: orderRow } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  const order = orderRow as OrderWithItems | null;
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const admin = createAdminClient();

  const { data: openRows } = await admin
    .from("returns")
    .select("id")
    .eq("order_id", order.id)
    .in("status", ["requested", "approved"]);

  const eligibility = checkReturnEligibility(order, (openRows ?? []).length > 0);
  if (!eligibility.eligible) {
    return NextResponse.json({ error: eligibility.reason }, { status: 409 });
  }

  // Price the return from the order's own lines, never from the request.
  const itemsById = new Map(order.order_items.map((i) => [i.id, i]));
  const items: ReturnItem[] = [];
  let refundAmount = 0;

  for (const requested of parsed.data.items) {
    const line = itemsById.get(requested.orderItemId);
    if (!line) {
      return NextResponse.json(
        { error: "One of the selected items is not part of this order." },
        { status: 400 },
      );
    }
    if (requested.quantity > line.quantity) {
      return NextResponse.json(
        { error: `You can return at most ${line.quantity} of "${line.title}".` },
        { status: 400 },
      );
    }

    items.push({
      order_item_id: line.id,
      title: line.title,
      variant_info: line.variant_info,
      quantity: requested.quantity,
    });
    refundAmount = round2(
      refundAmount + Number(line.unit_price) * requested.quantity,
    );
  }

  const { data, error } = await supabase
    .from("returns")
    .insert({
      order_id: order.id,
      user_id: user.id,
      order_number: order.order_number,
      email: order.email,
      reason: parsed.data.reason,
      comment: parsed.data.comment?.trim() || null,
      items,
      refund_amount: refundAmount,
    })
    .select()
    .single();

  if (error) {
    // 23505 is the partial unique index guarding one open return per order.
    const duplicate = error.code === "23505";
    return NextResponse.json(
      {
        error: duplicate
          ? "A return is already open for this order."
          : "Could not submit your return request.",
      },
      { status: duplicate ? 409 : 500 },
    );
  }

  return NextResponse.json({ request: data });
}
