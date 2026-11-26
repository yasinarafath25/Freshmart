import Link from "next/link";
import { Download } from "lucide-react";
import { requireStaffPage } from "@/lib/auth/guards";
import { couponUsage, salesByCategory, salesByDay, topProducts } from "@/lib/services/reports";
import { getSettings } from "@/lib/services/settings";
import { formatMoney } from "@/lib/utils/money";
import { NoAccess, PageHeader, Table, td, filterInput } from "@/components/admin/ui";
import { BarChart, RankBars } from "@/components/admin/Chart";
import { Card } from "@/components/ui";
import { parseRange } from "@/lib/utils/range";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const { allowed } = await requireStaffPage("reports:read");
  if (!allowed) return <NoAccess />;
  const settings = await getSettings();
  const r = parseRange(await searchParams, settings.timeZone);
  const [days, cats, top, cpn] = await Promise.all([salesByDay(r), salesByCategory(r), topProducts(r, 10), couponUsage(r)]);
  const fmt = (n: number) => formatMoney(n, settings.currencySymbol);
  const total = days.reduce((s, d) => s + d.revenue, 0);
  const orders = days.reduce((s, d) => s + d.orders, 0);
  const qs = `from=${r.fromStr}&to=${r.toStr}`;
  return (
    <>
      <PageHeader
        title="Reports"
        description="Sales from non-cancelled orders, by order date."
        actions={<Link href={`/admin/reports/export?${qs}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold hover:border-brand-600"><Download className="size-4" aria-hidden /> Export CSV</Link>}
      />
      <form method="get" className="mb-6 flex flex-wrap items-end gap-2 rounded-2xl border border-line bg-white p-3">
        <label className="text-xs text-ink-600">From <input type="date" name="from" defaultValue={r.fromStr} className={filterInput} /></label>
        <label className="text-xs text-ink-600">To <input type="date" name="to" defaultValue={r.toStr} className={filterInput} /></label>
        <button className="h-10 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white">Apply</button>
      </form>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-ink-600">Revenue</p><p className="text-2xl font-bold tabular-nums">{fmt(total)}</p></Card>
        <Card className="p-5"><p className="text-sm text-ink-600">Orders</p><p className="text-2xl font-bold tabular-nums">{orders}</p></Card>
        <Card className="p-5"><p className="text-sm text-ink-600">Average order</p><p className="text-2xl font-bold tabular-nums">{fmt(orders ? Math.round(total / orders) : 0)}</p></Card>
      </div>
      <Card className="mb-6 p-5">
        <h2 className="font-semibold">Revenue by day</h2>
        <div className="mt-4"><BarChart label="Revenue by day" data={days.map((d) => ({ key: d.day, label: new Date(d.day + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }), value: d.revenue }))} format={fmt} height={200} /></div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5"><h2 className="mb-4 font-semibold">Sales by category</h2>{cats.length ? <RankBars rows={cats.map((c) => ({ label: c.category, value: c.revenue, sub: `· ${c.units} units` }))} format={fmt} /> : <p className="text-sm text-ink-600">No sales in this period.</p>}</Card>
        <Card className="p-5"><h2 className="mb-4 font-semibold">Top products</h2>{top.length ? <RankBars rows={top.map((t) => ({ label: t.name, value: t.revenue, sub: `· ${t.units} sold` }))} format={fmt} /> : <p className="text-sm text-ink-600">No sales in this period.</p>}</Card>
      </div>
      <h2 className="mb-3 mt-8 font-semibold">Coupon usage</h2>
      <Table head={["Code", "Uses", "Total discount"]} empty={cpn.length === 0 && <p className="p-6 text-center text-sm text-ink-600">No coupons used in this period.</p>}>
        {cpn.map((c) => <tr key={c.code}><td className={`${td} font-mono font-bold`}>{c.code}</td><td className={`${td} tabular-nums`}>{c.uses}</td><td className={`${td} tabular-nums`}>{fmt(c.discount)}</td></tr>)}
      </Table>
    </>
  );
}
