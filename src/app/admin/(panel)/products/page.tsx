import Link from "next/link";
import { and, asc, desc, eq, ilike, sql, type SQL } from "drizzle-orm";
import { Package, Plus } from "lucide-react";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { categories, products } from "@/lib/db/schema";
import { getSettings } from "@/lib/services/settings";
import { getI18n } from "@/lib/i18n/server";
import { EmptyBlock, FilterBar, NoAccess, PageHeader, Pager, Table, filterInput, td } from "@/components/admin/ui";
import { Alert, Badge, ButtonLink } from "@/components/ui";
import { deleteProductAction, toggleProductActiveAction } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export const metadata = { title: "Products" };
type SP = { q?: string; category?: string; status?: string; page?: string; saved?: string };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { allowed } = await requireStaffPage("products:write");
  if (!allowed) return <NoAccess />;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const per = 25;
  const conds: (SQL | undefined)[] = [];
  if (sp.q) conds.push(ilike(products.name, `%${sp.q.slice(0, 60).replace(/[%_\\]/g, (m) => "\\" + m)}%`));
  if (sp.category && /^[0-9a-f-]{36}$/.test(sp.category)) conds.push(eq(products.categoryId, sp.category));
  if (sp.status === "active") conds.push(eq(products.isActive, true));
  if (sp.status === "hidden") conds.push(eq(products.isActive, false));
  const where = and(...conds);
  const db = getDb();
  const [rows, count, cats, settings, { t, money, num, name, lang }] = await Promise.all([
    db
      .select({
        p: products,
        category: categories.name,
        minPrice: sql<number>`(select min(price) from product_variants v where v.product_id = "products"."id")`,
        stock: sql<number>`(select coalesce(sum(stock),0)::int from product_variants v where v.product_id = "products"."id")`,
        variants: sql<number>`(select count(*)::int from product_variants v where v.product_id = "products"."id")`,
      })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(where)
      .orderBy(desc(products.updatedAt))
      .limit(per)
      .offset((page - 1) * per),
    db.$count(products, where),
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    getSettings(),
    getI18n(),
  ]);
  const pages = Math.max(1, Math.ceil(count / per));
  return (
    <>
      <PageHeader title={t("Products", "পণ্য")} description={t(`${count} products in your shop.`, `আপনার দোকানে মোট ${num(count)}টি পণ্য।`)} actions={<ButtonLink href="/admin/products/create"><Plus className="size-4" aria-hidden /> {t("Add product", "নতুন পণ্য যোগ করুন")}</ButtonLink>} />
      {sp.saved && <Alert tone="success" className="mb-4">{t("Product saved.", "পণ্য সংরক্ষণ হয়েছে।")}</Alert>}
      <FilterBar action="/admin/products">
        <input name="q" defaultValue={sp.q} placeholder={t("Search by name", "নাম দিয়ে খুঁজুন")} className={`${filterInput} w-full sm:w-56`} aria-label={t("Search products", "পণ্য খুঁজুন")} />
        <select name="category" defaultValue={sp.category ?? ""} className={filterInput} aria-label={t("Category", "ক্যাটাগরি")}>
          <option value="">{t("All categories", "সব ক্যাটাগরি")}</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{name(c)}</option>)}
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className={filterInput} aria-label={t("Visibility", "দেখানো")}>
          <option value="">{t("Visible & hidden", "দেখানো ও লুকানো সব")}</option><option value="active">{t("Visible", "দেখানো হচ্ছে")}</option><option value="hidden">{t("Hidden", "লুকানো")}</option>
        </select>
      </FilterBar>
      <Table head={[t("Product", "পণ্য"), t("Category", "ক্যাটাগরি"), t("Price", "দাম"), t("Stock", "স্টক"), t("Status", "অবস্থা"), ""]} empty={rows.length === 0 && <EmptyBlock icon={<Package className="size-7" aria-hidden />} title={t("No products found", "কোনো পণ্য পাওয়া যায়নি")} body={t("Add your first product or change the filters.", "নতুন পণ্য যোগ করুন অথবা ফিল্টার বদলান।")} action={<ButtonLink href="/admin/products/create"><Plus className="size-4" aria-hidden /> {t("Add product", "নতুন পণ্য যোগ করুন")}</ButtonLink>} />}>
        {rows.map(({ p, category, minPrice, stock, variants }) => (
          <tr key={p.id} className="hover:bg-canvas">
            <td className={td}>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images[0] ?? "/images/placeholder.svg"} alt="" width={44} height={44} className="size-11 rounded-lg border border-line object-cover" />
                <div><Link href={`/admin/products/${p.id}/edit`} className="font-semibold hover:text-brand-700">{name(p)}</Link><span className="block text-xs text-ink-400">{t(`${variants} size${variants === 1 ? "" : "s"}`, `${num(variants)}টি সাইজ`)}{lang === "bn" ? ` · ${p.name}` : p.nameBn ? ` · ${p.nameBn}` : ""}</span></div>
              </div>
            </td>
            <td className={td}>{category ?? "—"}</td>
            <td className={`${td} tabular-nums`}>{minPrice !== null ? money(minPrice) : "—"}</td>
            <td className={`${td} tabular-nums ${stock <= settings.lowStockThreshold ? "font-semibold text-tomato-600" : ""}`}>{num(stock)}</td>
            <td className={td}>{p.isActive ? <Badge tone="green">{t("Visible", "দেখানো হচ্ছে")}</Badge> : <Badge>{t("Hidden", "লুকানো")}</Badge>}{p.isFeatured && <Badge tone="yellow" className="ml-1">{t("Featured", "বিশেষ")}</Badge>}</td>
            <td className={`${td} whitespace-nowrap text-right`}>
              <Link href={`/admin/products/${p.id}/edit`} className="mr-3 font-semibold text-brand-700 hover:underline">{t("Edit", "এডিট")}</Link>
              <form action={toggleProductActiveAction} className="mr-3 inline"><input type="hidden" name="id" value={p.id} /><button className="font-semibold text-ink-600 hover:text-ink-900">{p.isActive ? t("Hide", "লুকান") : t("Show", "দেখান")}</button></form>
              <form action={deleteProductAction} className="inline"><input type="hidden" name="id" value={p.id} /><ConfirmButton message={t(`Delete “${p.name}”? Past orders keep their records. This can’t be undone.`, `“${name(p)}” মুছে ফেলবেন? আগের অর্ডারের হিসাব থেকে যাবে। এটা আর ফেরানো যাবে না।`)}>{t("Delete", "মুছুন")}</ConfirmButton></form>
            </td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={pages} href={(n) => `/admin/products?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([k, v]) => v && k !== "saved")), page: String(n) })}`} />
    </>
  );
}
