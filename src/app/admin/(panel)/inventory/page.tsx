import Link from "next/link";
import { and, asc, desc, eq, ilike, lte, sql, type SQL } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { inventoryMovements, productVariants, products, users } from "@/lib/db/schema";
import { getSettings } from "@/lib/services/settings";
import { FilterBar, NoAccess, PageHeader, Pager, Table, filterInput, td } from "@/components/admin/ui";
import { StockAdjust } from "@/components/admin/StockAdjust";
import { Card } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Inventory" };
type SP = { q?: string; low?: string; page?: string };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { allowed } = await requireStaffPage("inventory:write");
  if (!allowed) return <NoAccess />;
  const sp = await searchParams;
  const [settings, { t, num, dateTime }] = await Promise.all([getSettings(), getI18n()]);
  const page = Math.max(1, Number(sp.page) || 1);
  const per = 30;
  const conds: (SQL | undefined)[] = [];
  if (sp.q) conds.push(ilike(products.name, `%${sp.q.slice(0, 60).replace(/[%_\\]/g, (m) => "\\" + m)}%`));
  if (sp.low) conds.push(lte(productVariants.stock, settings.lowStockThreshold));
  const where = and(...conds);
  const db = getDb();
  const [rows, count, moves] = await Promise.all([
    db
      .select({ v: productVariants, product: products.name, productId: products.id })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(where)
      .orderBy(asc(productVariants.stock), asc(products.name))
      .limit(per)
      .offset((page - 1) * per),
    db.select({ n: sql<number>`count(*)::int` }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).where(where),
    db
      .select({ m: inventoryMovements, variant: productVariants.name, product: products.name, actor: users.name })
      .from(inventoryMovements)
      .innerJoin(productVariants, eq(productVariants.id, inventoryMovements.variantId))
      .innerJoin(products, eq(products.id, productVariants.productId))
      .leftJoin(users, eq(users.id, inventoryMovements.actorId))
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(25),
  ]);
  const pages = Math.max(1, Math.ceil((count[0]?.n ?? 0) / per));
  return (
    <>
      <PageHeader title={t("Inventory", "স্টক")} description={t(`Stock for every size. Items at or below ${settings.lowStockThreshold} are “low stock” (change in Settings). Type +10 when new stock arrives, -2 for damage.`, `প্রতিটি সাইজের স্টক। ${num(settings.lowStockThreshold)} বা তার কম হলে “স্টক কম” ধরা হয় (সেটিংসে বদলানো যায়)। নতুন মাল এলে +১০, নষ্ট হলে -২ লিখুন।`)} />
      <FilterBar action="/admin/inventory">
        <input name="q" defaultValue={sp.q} placeholder={t("Search product", "পণ্য খুঁজুন")} className={`${filterInput} w-full sm:w-56`} aria-label={t("Search product", "পণ্য খুঁজুন")} />
        <label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" name="low" value="1" defaultChecked={!!sp.low} className="accent-brand-700" /> {t("Low stock only", "শুধু কম স্টক")}</label>
      </FilterBar>
      <div className="grid gap-6 2xl:grid-cols-[1fr_420px]">
        <div>
          <Table head={[t("Product / size", "পণ্য / সাইজ"), "SKU", t("Stock", "স্টক"), t("Add or remove stock", "স্টক বাড়ান / কমান")]} empty={rows.length === 0 && <p className="p-8 text-center text-sm text-ink-600">{t("Nothing matches.", "কিছু পাওয়া যায়নি।")}</p>}>
            {rows.map(({ v, product, productId }) => (
              <tr key={v.id}>
                <td className={td}><Link href={`/admin/products/${productId}/edit`} className="font-semibold hover:text-brand-700">{product}</Link><span className="block text-xs text-ink-400">{v.name}</span></td>
                <td className={`${td} font-mono text-xs`}>{v.sku}</td>
                <td className={`${td} text-lg font-bold tabular-nums ${v.stock === 0 ? "text-tomato-600" : v.stock <= settings.lowStockThreshold ? "text-amber-700" : ""}`}>{num(v.stock)}</td>
                <td className={td}><StockAdjust variantId={v.id} /></td>
              </tr>
            ))}
          </Table>
          <Pager page={page} pages={pages} href={(n) => `/admin/inventory?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([, x]) => x)), page: String(n) })}`} />
        </div>
        <Card className="h-fit p-5">
          <h2 className="font-semibold">{t("Recent stock changes", "সাম্প্রতিক স্টক পরিবর্তন")}</h2>
          {moves.length === 0 ? <p className="mt-3 text-sm text-ink-600">{t("No changes yet.", "এখনো কোনো পরিবর্তন নেই।")}</p> : (
            <ul className="mt-3 divide-y divide-line text-sm">
              {moves.map(({ m, variant, product, actor }) => (
                <li key={m.id} className="flex justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{product} · {variant}</span>
                    <span className="text-xs text-ink-400">{({ order: t("Sale", "বিক্রি"), restock: t("Restock", "নতুন মাল"), adjustment: t("Adjustment", "সংশোধন"), cancel: t("Order cancelled", "অর্ডার বাতিল") } as Record<string, string>)[m.reason] ?? m.reason}{m.reference ? ` · ${m.reference}` : ""} · {actor ?? t("system", "সিস্টেম")} · {dateTime(m.createdAt)}</span>
                  </span>
                  <span className={`shrink-0 font-semibold tabular-nums ${m.change > 0 ? "text-brand-700" : "text-tomato-600"}`}>{m.change > 0 ? `+${m.change}` : m.change}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
