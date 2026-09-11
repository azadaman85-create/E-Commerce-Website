import type { Metadata } from "next";
import { ProfileSettings } from "@/components/storefront/ProfileSettings";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "Profile settings",
  robots: { index: false },
};

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return <ProfileSettings profile={data as Profile} />;
}
