import type { Metadata } from "next";
import { CheckoutClient } from "@/components/storefront/CheckoutClient";
import { createClient } from "@/lib/supabase/server";
import { getShippingMethods, getSiteSettings } from "@/lib/queries";
import { DEFAULT_SETTINGS } from "@/context/SettingsContext";
import type { Address, Profile } from "@/types";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const supabase = createClient();
  const [shippingMethods, settings] = await Promise.all([
    getShippingMethods(),
    getSiteSettings(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let addresses: Address[] = [];
  let profile: Profile | null = null;

  // Signed-in customers get their saved addresses pre-filled.
  if (user) {
    const [{ data: addressRows }, { data: profileRow }] = await Promise.all([
      supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false }),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);
    addresses = (addressRows as Address[]) ?? [];
    profile = (profileRow as Profile) ?? null;
  }

  return (
    <CheckoutClient
      shippingMethods={shippingMethods}
      settings={settings ?? DEFAULT_SETTINGS}
      savedAddresses={addresses}
      profile={profile}
      userEmail={user?.email ?? null}
    />
  );
}
