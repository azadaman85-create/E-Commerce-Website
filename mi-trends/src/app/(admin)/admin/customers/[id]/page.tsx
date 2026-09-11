import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomerDetail } from "@/components/admin/CustomerDetail";
import { getSiteSettings } from "@/lib/queries";
import type { Address, OrderWithItems, Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminClient();

  const [{ data: profileRow }, { data: orderRows }, { data: addressRows }, settings] =
    await Promise.all([
      admin.from("profiles").select("*").eq("id", params.id).maybeSingle(),
      admin
        .from("orders")
        .select("*, order_items(id, quantity)")
        .eq("user_id", params.id)
        .order("created_at", { ascending: false }),
      admin.from("addresses").select("*").eq("user_id", params.id),
      getSiteSettings(),
    ]);

  const profile = profileRow as Profile | null;
  if (!profile) notFound();

  return (
    <>
      <Link
        href="/admin/customers"
        className="mb-6 inline-flex items-center gap-2 text-caption uppercase tracking-[0.1em] text-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        All customers
      </Link>

      <CustomerDetail
        profile={profile}
        orders={(orderRows as unknown as OrderWithItems[]) ?? []}
        addresses={(addressRows as Address[]) ?? []}
        currencySymbol={settings?.currency_symbol ?? "₹"}
        currencyCode={settings?.currency_code ?? "INR"}
      />
    </>
  );
}
