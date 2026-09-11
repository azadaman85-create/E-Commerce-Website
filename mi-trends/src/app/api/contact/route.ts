import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(254),
  subject: z.string().max(200).optional(),
  message: z.string().min(10).max(4000),
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form." },
      { status: 400 },
    );
  }

  const supabase = createClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name.trim(),
    email: parsed.data.email.toLowerCase().trim(),
    subject: parsed.data.subject?.trim() || null,
    message: parsed.data.message.trim(),
  });

  if (error) {
    return NextResponse.json({ error: "Could not send your message." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
