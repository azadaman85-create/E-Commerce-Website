import { createAdminClient } from "@/lib/supabase/admin";
import { MessagesManager } from "@/components/admin/MessagesManager";
import type { ContactMessage, Subscriber } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const admin = createAdminClient();

  const [{ data: messages }, { data: subscribers }] = await Promise.all([
    admin.from("contact_messages").select("*").order("created_at", { ascending: false }),
    admin.from("subscribers").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <MessagesManager
      messages={(messages as ContactMessage[]) ?? []}
      subscribers={(subscribers as Subscriber[]) ?? []}
    />
  );
}
