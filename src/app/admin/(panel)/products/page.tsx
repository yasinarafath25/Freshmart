import Link from "next/link";
import { and, asc, desc, eq, ilike, sql, type SQL } from "drizzle-orm";
import { Plus } from "lucide-react";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { categories, products } from "@/lib/db/schema";
import { getSettings } from "@/lib/services/settings";
import { formatMoney } from "@/lib/utils/money";
import { FilterBar, NoAccess, PageHeader, Pager, Table, filterInput, td } from "@/components/admin/ui";
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
  const [rows, count, cats, settings] = await Promise.all([
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
  ]);
  const pages = Math.max(1, Math.ceil(count / per));
  return (
    <>
      <PageHeader title="Products" description={`${count} products`} actions={<ButtonLink href="/admin/products/create"><Plus className="size-4" aria-hidden /> Add product</ButtonLink>} />
      {sp.saved && <Alert tone="success" className="mb-4">Product saved.</Alert>}
      <FilterBar action="/admin/products">
        <input name="q" defaultValue={sp.q} placeholder="Search name" className={`${filterInput} w-56`} aria-label="Search products" />
        <select name="category" defaultValue={sp.category ?? ""} className={filterInput} aria-label="Category">
          <option value="">All categories</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className={filterInput} aria-label="Visibility">
          <option value="">Any visibility</option><option value="active">Visible</option><option value="hidden">Hidden</option>
        </select>
      </FilterBar>
      <Table head={["Product", "Category", "Price", "Stock", "Status", ""]} empty={rows.length === 0 && <p className="p-8 text-center text-sm text-ink-600">No products found.</p>}>
        {rows.map(({ p, category, minPrice, stock, variants }) => (
          <tr key={p.id} className="hover:bg-canvas">
            <td className={td}>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images[0] ?? "/images/placeholder.svg"} alt="" width={44} height={44} className="size-11 rounded-lg border border-line object-cover" />
                <div><Link href={`/admin/products/${p.id}/edit`} className="font-semibold hover:text-brand-700">{p.name}</Link><span className="block text-xs text-ink-400">{variants} variant{variants === 1 ? "" : "s"} · /{p.slug}</span></div>
              </div>
            </td>
            <td className={td}>{category ?? "—"}</td>
            <td className={`${td} tabular-nums`}>{minPrice !== null ? formatMoney(minPrice, settings.currencySymbol) : "—"}</td>
            <td className={`${td} tabular-nums ${stock <= settings.lowStockThreshold ? "font-semibold text-tomato-600" : ""}`}>{stock}</td>
            <td className={td}>{p.isActive ? <Badge tone="green">Visible</Badge> : <Badge>Hidden</Badge>}{p.isFeatured && <Badge tone="yellow" className="ml-1">Featured</Badge>}</td>
            <td className={`${td} whitespace-nowrap text-right`}>
              <Link href={`/admin/products/${p.id}/edit`} className="mr-3 font-semibold text-brand-700 hover:underline">Edit</Link>
              <form action={toggleProductActiveAction} className="mr-3 inline"><input type="hidden" name="id" value={p.id} /><button className="font-semibold text-ink-600 hover:text-ink-900">{p.isActive ? "Hide" : "Show"}</button></form>
              <form action={deleteProductAction} className="inline"><input type="hidden" name="id" value={p.id} /><ConfirmButton message={`Delete “${p.name}”? Past orders keep their records. This can’t be undone.`}>Delete</ConfirmButton></form>
            </td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={pages} href={(n) => `/admin/products?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([k, v]) => v && k !== "saved")), page: String(n) })}`} />
    </>
  );
}
