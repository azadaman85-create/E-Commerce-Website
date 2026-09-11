import { redirect } from "next/navigation";
import { AccountNav } from "@/components/storefront/AccountNav";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects unauthenticated users; this is the
  // server-side backstop in case the matcher ever changes.
  if (!user) redirect("/auth?next=/account");

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = data as Profile | null;

  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-12">
        <span className="label-caps">My account</span>
        <h1 className="mt-3 font-serif text-section-sm leading-tight text-ink md:text-section">
          {profile?.full_name ? `Hello, ${profile.full_name.split(" ")[0]}` : "Hello"}
        </h1>
      </header>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-16">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
