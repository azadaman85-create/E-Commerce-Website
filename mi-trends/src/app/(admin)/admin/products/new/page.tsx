import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getCategories();
  return <ProductForm product={null} categories={categories} />;
}
