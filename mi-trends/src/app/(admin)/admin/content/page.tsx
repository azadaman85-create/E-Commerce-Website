import { createAdminClient } from "@/lib/supabase/admin";
import { ContentManager } from "@/components/admin/ContentManager";
import type { Banner, SocialPost, Testimonial } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const admin = createAdminClient();

  const [{ data: testimonials }, { data: socialPosts }, { data: banners }] =
    await Promise.all([
      admin.from("testimonials").select("*").order("sort_order"),
      admin.from("social_posts").select("*").order("sort_order"),
      admin.from("banners").select("*").order("starts_at", { nullsFirst: false }),
    ]);

  return (
    <ContentManager
      testimonials={(testimonials as Testimonial[]) ?? []}
      socialPosts={(socialPosts as SocialPost[]) ?? []}
      banners={(banners as Banner[]) ?? []}
    />
  );
}
