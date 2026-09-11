import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminUI";
import { DashboardClient } from "@/components/admin/DashboardClient";
import { getDashboardData } from "@/lib/analytics";
import { getSiteSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [data, settings] = await Promise.all([
    getDashboardData(365),
    getSiteSettings(),
  ]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Performance over the last 30 days, compared with the 30 before."
        action={
          <Link
            href="/admin/analytics"
            className="inline-flex h-11 items-center gap-2 rounded-sm border border-ink/15 px-5 text-caption uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink/45"
          >
            <TrendingUp className="h-4 w-4" aria-hidden />
            Full analytics
          </Link>
        }
      />

      <DashboardClient
        data={data}
        currencySymbol={settings?.currency_symbol ?? "₹"}
        currencyCode={settings?.currency_code ?? "INR"}
      />
    </>
  );
}
