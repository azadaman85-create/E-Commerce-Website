import { createAdminClient } from "@/lib/supabase/admin";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import type { MediaAsset } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const admin = createAdminClient();

  const [{ data: media }, { data: productImages }] = await Promise.all([
    admin.from("media").select("*").order("created_at", { ascending: false }),
    admin.from("product_images").select("image_url"),
  ]);

  // Used to warn before deleting an image a product still references.
  const inUse = new Set(
    ((productImages as { image_url: string }[]) ?? []).map((row) => row.image_url),
  );

  return (
    <MediaLibrary
      assets={(media as MediaAsset[]) ?? []}
      inUseUrls={[...inUse]}
    />
  );
}
