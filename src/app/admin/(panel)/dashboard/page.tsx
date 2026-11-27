import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { AlertTriangle, Banknote, Clock, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { orders, users } from "@/lib/db/schema";
import { lowStockList, overview, salesByDay, topProducts } from "@/lib/services/reports";
import { getSettings } from "@/lib/services/settings";
import { formatMoney } from "@/lib/utils/money";
import { storeDate } from "@/lib/utils/dates";
import { NoAccess, PageHeader, StatCard, Table, td } from "@/components/admin/ui";
import { BarChart, RankBars } from "@/components/admin/Chart";
import { Card } from "@/components/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/store/OrderBits";
import { QuickAdvance } from "@/components/admin/OrderControls";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { allowed } = await requireStaffPage("dashboard:read");
  if (!allowed) return <NoAccess />;
  const settings = await getSettings();
  const cur = settings.currencySymbol;
  const fmt = (n: number) => formatMoney(n, cur);
  const tz = settings.timeZone;
  const last14 = { from: storeDate(tz, -13), to: storeDate(tz), tz };
  const last30 = { from: storeDate(tz, -29), to: storeDate(tz), tz };
  const [stats, days, top, low, latest] = await Promise.all([
    overview(settings.lowStockThreshold, tz),
    salesByDay(last14),
    topProducts(last30, 5),
    lowStockList(settings.lowStockThreshold, 6),
    getDb()
      .select({ o: orders, customer: users.name })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.userId))
      .orderBy(desc(orders.createdAt))
      .limit(8),
  ]);
  const short = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <>
      <PageHeader title="Dashboard" description="Store performance at a glance. Revenue excludes cancelled orders." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue · last 30 days" value={fmt(stats.revenue30)} sub={`${fmt(stats.collected30)} collected`} icon={<TrendingUp className="size-5" />} />
        <StatCard label="Orders · last 30 days" value={String(stats.orders30)} sub={`Avg. order ${fmt(stats.aov30)}`} icon={<ShoppingCart className="size-5" />} tone="blue" />
        <StatCard label="Today" value={fmt(stats.revenueToday)} sub={`${stats.ordersToday} orders`} icon={<Banknote className="size-5" />} />
        <StatCard label="Customers" value={String(stats.customers)} icon={<Users className="size-5" />} tone="blue" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/orders?status=pending" className="block"><StatCard label="Pending orders" value={String(stats.pending)} sub="Waiting for confirmation" icon={<Clock className="size-5" />} tone="yellow" /></Link>
        <Link href="/admin/inventory?low=1" className="block"><StatCard label="Low-stock variants" value={String(stats.lowStock)} sub={`At or below ${settings.lowStockThreshold} units`} icon={<AlertTriangle className="size-5" />} tone="red" /></Link>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Revenue · last 14 days</h2>
          <div className="mt-4"><BarChart label="Revenue per day" data={days.map((d) => ({ key: d.day, label: short(d.day), value: d.revenue }))} format={fmt} /></div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Orders · last 14 days</h2>
          <div className="mt-4"><BarChart label="Orders per day" data={days.map((d) => ({ key: d.day, label: short(d.day), value: d.orders }))} format={(n) => String(n)} /></div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Latest orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>
          </div>
          <Table head={["Order", "Customer", "Status", "Payment", "Total"]} empty={latest.length === 0 && <p className="p-6 text-center text-sm text-ink-600">No orders yet.</p>}>
            {latest.map(({ o, customer }) => (
              <tr key={o.id} className="hover:bg-canvas">
                <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-700 hover:underline">{o.orderNumber}</Link><span className="block text-xs text-ink-400">{o.createdAt.toLocaleString("en-GB")}</span></td>
                <td className={td}>{customer}</td>
                <td className={td}><div className="flex flex-col items-start gap-2"><OrderStatusBadge status={o.status} /><QuickAdvance orderId={o.id} status={o.status} /></div></td>
                <td className={td}><PaymentStatusBadge status={o.paymentStatus} /></td>
                <td className={`${td} font-semibold tabular-nums`}>{fmt(o.total)}</td>
              </tr>
            ))}
          </Table>
        </div>
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Top products · 30 days</h2>
            {top.length ? <RankBars rows={top.map((t) => ({ label: t.name, value: t.revenue, sub: `· ${t.units} sold` }))} format={fmt} /> : <p className="text-sm text-ink-600">No sales yet.</p>}
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Low stock</h2>
            {low.length ? (
              <ul className="divide-y divide-line text-sm">
                {low.map((l) => (
                  <li key={l.id} className="flex justify-between py-2">
                    <Link href={`/admin/products/${l.productId}/edit`} className="hover:text-brand-700">{l.product} <span className="text-ink-400">· {l.variant}</span></Link>
                    <span className={`font-semibold tabular-nums ${l.stock === 0 ? "text-tomato-600" : "text-amber-700"}`}>{l.stock}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-600">All variants are well stocked.</p>}
          </Card>
        </div>
      </div>
    </>
  );
}
