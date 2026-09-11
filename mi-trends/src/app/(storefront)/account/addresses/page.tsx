import type { Metadata } from "next";
import { AddressBook } from "@/components/storefront/AddressBook";
import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/types";

export const metadata: Metadata = {
  title: "Address book",
  robots: { index: false },
};

export default async function AddressesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user!.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return <AddressBook initialAddresses={(data as Address[]) ?? []} userId={user!.id} />;
}
