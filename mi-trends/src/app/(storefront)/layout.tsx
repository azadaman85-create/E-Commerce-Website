import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { PageTransition } from "@/components/storefront/PageTransition";
import { getCategories } from "@/lib/queries";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();

  return (
    <div className="flex min-h-screen flex-col">
      <Header categories={categories} />
      <PageTransition>{children}</PageTransition>
      <Footer categories={categories} />
      <CartDrawer />
    </div>
  );
}
