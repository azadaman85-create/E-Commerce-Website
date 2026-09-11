import { PageHeader } from "@/components/admin/AdminUI";
import { AnalyticsClient } from "@/components/admin/AnalyticsClient";
import { getDashboardData } from "@/lib/analytics";
import { getSiteSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const [data, settings] = await Promise.all([
    getDashboardData(365),
    getSiteSettings(),
  ]);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Revenue, orders, products and customer growth over the last year."
      />
      <AnalyticsClient
        data={data}
        currencySymbol={settings?.currency_symbol ?? "₹"}
        currencyCode={settings?.currency_code ?? "INR"}
      />
    </>
  );
}
