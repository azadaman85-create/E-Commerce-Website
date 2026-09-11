import { createAdminClient } from "@/lib/supabase/admin";
import { SeoManager } from "@/components/admin/SeoManager";
import type { PageSeo, SeoSettings } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const admin = createAdminClient();

  const [{ data: seo }, { data: pages }] = await Promise.all([
    admin.from("seo_settings").select("*").limit(1).maybeSingle(),
    admin.from("page_seo").select("*").order("page_slug"),
  ]);

  return (
    <SeoManager
      seo={seo as SeoSettings | null}
      pages={(pages as PageSeo[]) ?? []}
    />
  );
}
