import { createAdminClient } from "@/lib/supabase/admin";
import { ReviewsManager, type AdminReview } from "@/components/admin/ReviewsManager";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const admin = createAdminClient();

  // Join the product so a reviewer's words are not stranded from what they
  // reviewed, and the moderator can click straight through to the PDP.
  const { data } = await admin
    .from("reviews")
    .select("*, products(title, slug)")
    .order("created_at", { ascending: false });

  return <ReviewsManager reviews={(data as unknown as AdminReview[]) ?? []} />;
}
