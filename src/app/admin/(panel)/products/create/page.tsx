import Link from "next/link";
import { asc } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";
import { getSettings } from "@/lib/services/settings";
import { NoAccess, PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "New product" };

export default async function CreateProductPage() {
  const { allowed } = await requireStaffPage("products:write");
  if (!allowed) return <NoAccess />;
  const [cats, settings] = await Promise.all([getDb().select().from(categories).orderBy(asc(categories.sortOrder)), getSettings()]);
  return (
    <>
      <Link href="/admin/products" className="text-sm text-ink-600 hover:text-brand-700">← Products</Link>
      <PageHeader title="New product" />
      <ProductForm
        currency={settings.currencySymbol}
        categories={cats.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId }))}
        initial={{ name: "", slug: "", description: "", categoryId: null, unit: "kg", origin: "", freshnessLabel: "Fresh", images: [], isOrganic: false, isFeatured: false, isSeasonal: false, isActive: true, variants: [] }}
      />
    </>
  );
}
