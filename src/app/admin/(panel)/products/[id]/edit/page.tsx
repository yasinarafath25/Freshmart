import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { categories, productVariants, products } from "@/lib/db/schema";
import { getSettings } from "@/lib/services/settings";
import { NoAccess, PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "Edit product" };

const major = (n: number | null) => (n === null ? "" : String(n / 100));

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requireStaffPage("products:write");
  if (!allowed) return <NoAccess />;
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const db = getDb();
  const p = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!p) notFound();
  const [vs, cats, settings] = await Promise.all([
    db.select().from(productVariants).where(eq(productVariants.productId, id)).orderBy(asc(productVariants.sortOrder)),
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    getSettings(),
  ]);
  return (
    <>
      <Link href="/admin/products" className="text-sm text-ink-600 hover:text-brand-700">← Products</Link>
      <PageHeader title={`Edit: ${p.name}`} actions={<Link href={`/product/${p.slug}`} target="_blank" className="text-sm font-semibold text-brand-700 hover:underline">View in store ↗</Link>} />
      <ProductForm
        currency={settings.currencySymbol}
        categories={cats.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId }))}
        initial={{
          id: p.id,
          name: p.name,
          nameBn: p.nameBn ?? "",
          slug: p.slug,
          description: p.description,
          descriptionBn: p.descriptionBn ?? "",
          categoryId: p.categoryId,
          unit: p.unit,
          origin: p.origin ?? "",
          freshnessLabel: p.freshnessLabel ?? "",
          images: p.images,
          isOrganic: p.isOrganic,
          isFeatured: p.isFeatured,
          isSeasonal: p.isSeasonal,
          isActive: p.isActive,
          variants: vs.map((v) => ({ id: v.id, name: v.name, sku: v.sku, price: major(v.price), compareAtPrice: major(v.compareAtPrice), stock: String(v.stock), isDefault: v.isDefault })),
        }}
      />
    </>
  );
}
