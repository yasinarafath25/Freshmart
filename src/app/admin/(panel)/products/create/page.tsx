import { asc } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";
import { getSettings } from "@/lib/services/settings";
import { getI18n } from "@/lib/i18n/server";
import { NoAccess, PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "New product" };

export default async function CreateProductPage() {
  const { allowed } = await requireStaffPage("products:write");
  if (!allowed) return <NoAccess />;
  const [cats, settings, { t }] = await Promise.all([getDb().select().from(categories).orderBy(asc(categories.sortOrder)), getSettings(), getI18n()]);
  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: t("Products", "পণ্য") }} title={t("New product", "নতুন পণ্য")} description={t("Fill in the name, at least one size with price, and add a photo.", "নাম, অন্তত একটি সাইজ ও দাম দিন, আর একটি ছবি যোগ করুন।")} />
      <ProductForm
        currency={settings.currencySymbol}
        categories={cats.map((c) => ({ id: c.id, name: c.name, nameBn: c.nameBn, parentId: c.parentId }))}
        initial={{ name: "", nameBn: "", slug: "", description: "", descriptionBn: "", categoryId: null, unit: "kg", origin: "", freshnessLabel: "Fresh", images: [], isOrganic: false, isFeatured: false, isSeasonal: false, isActive: true, variants: [] }}
      />
    </>
  );
}
