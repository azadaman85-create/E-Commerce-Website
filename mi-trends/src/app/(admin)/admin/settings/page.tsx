import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsManager } from "@/components/admin/SettingsManager";
import type { HeroSlide, ShippingMethod, SiteSettings } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = createAdminClient();

  const [{ data: settings }, { data: methods }, { data: slides }] = await Promise.all([
    admin.from("site_settings").select("*").limit(1).maybeSingle(),
    admin.from("shipping_methods").select("*").order("sort_order"),
    admin.from("hero_slides").select("*").order("sort_order"),
  ]);

  return (
    <SettingsManager
      settings={settings as SiteSettings | null}
      shippingMethods={(methods as ShippingMethod[]) ?? []}
      heroSlides={(slides as HeroSlide[]) ?? []}
    />
  );
}
