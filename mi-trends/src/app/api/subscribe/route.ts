import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ email: z.string().email().max(254) });

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
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const supabase = createClient();
  const { error } = await supabase.from("subscribers").insert({ email });

  // 23505 = unique violation. Already subscribed is not a failure worth
  // surfacing as an error — and telling an attacker which emails exist
  // would leak the list.
  if (error && error.code !== "23505") {
    return NextResponse.json(
      { error: "Could not subscribe right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
