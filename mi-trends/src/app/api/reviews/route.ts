import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your review." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to leave a review." },
      { status: 401 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // RLS enforces "must have bought it" — a failure here is that rule firing.
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      product_id: parsed.data.productId,
      user_id: user.id,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      body: parsed.data.body || null,
      author_name: (profile as { full_name: string | null } | null)?.full_name ?? null,
    })
    .select()
    .single();

  if (error) {
    const alreadyReviewed = error.code === "23505";
    return NextResponse.json(
      {
        error: alreadyReviewed
          ? "You've already reviewed this product."
          : "Only verified buyers can review this product.",
      },
      { status: 403 },
    );
  }

  return NextResponse.json({ review: data });
}
