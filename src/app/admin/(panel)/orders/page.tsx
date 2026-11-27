import Link from "next/link";
import { and, desc, eq, gte, ilike, lt, or, sql, type SQL } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { orderStatus, orders, paymentStatus, users } from "@/lib/db/schema";
import { getSettings } from "@/lib/services/settings";
import { formatMoney } from "@/lib/utils/money";
import { FilterBar, NoAccess, PageHeader, Pager, Table, filterInput, td } from "@/components/admin/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/store/OrderBits";
import { QuickAdvance } from "@/components/admin/OrderControls";

export const metadata = { title: "Orders" };
type SP = { status?: string; payment?: string; q?: string; from?: string; to?: string; page?: string };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { allowed } = await requireStaffPage("orders:write");
  if (!allowed) return <NoAccess />;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const per = 25;
  const conds: (SQL | undefined)[] = [];
  if (sp.status && (orderStatus.enumValues as readonly string[]).includes(sp.status)) conds.push(eq(orders.status, sp.status as never));
  if (sp.payment && (paymentStatus.enumValues as readonly string[]).includes(sp.payment)) conds.push(eq(orders.paymentStatus, sp.payment as never));
  if (sp.q) {
    const t = `%${sp.q.slice(0, 60).replace(/[%_\\]/g, (m) => "\\" + m)}%`;
    conds.push(or(ilike(orders.orderNumber, t), ilike(orders.shipName, t), ilike(orders.shipPhone, t), ilike(users.email, t)));
  }
  if (sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from)) conds.push(gte(orders.createdAt, new Date(sp.from)));
  if (sp.to && /^\d{4}-\d{2}-\d{2}$/.test(sp.to)) conds.push(lt(orders.createdAt, new Date(new Date(sp.to).getTime() + 86400000)));
  const where = and(...conds);
  const db = getDb();
  const [rows, count, settings] = await Promise.all([
    db.select({ o: orders, email: users.email }).from(orders).innerJoin(users, eq(users.id, orders.userId)).where(where).orderBy(desc(orders.createdAt)).limit(per).offset((page - 1) * per),
    db.select({ n: sql<number>`count(*)::int` }).from(orders).innerJoin(users, eq(users.id, orders.userId)).where(where),
    getSettings(),
  ]);
  const pages = Math.max(1, Math.ceil((count[0]?.n ?? 0) / per));
  const qs = (n: number) => `/admin/orders?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([, v]) => v)), page: String(n) })}`;

  return (
    <>
      <PageHeader title="Orders" description={`${count[0]?.n ?? 0} orders`} />
      <FilterBar action="/admin/orders">
        <input name="q" defaultValue={sp.q} placeholder="Order #, name, phone, email" className={`${filterInput} w-64`} aria-label="Search orders" />
        <select name="status" defaultValue={sp.status ?? ""} className={filterInput} aria-label="Status">
          <option value="">All statuses</option>
          {orderStatus.enumValues.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <select name="payment" defaultValue={sp.payment ?? ""} className={filterInput} aria-label="Payment status">
          <option value="">All payments</option>
          {paymentStatus.enumValues.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="text-xs text-ink-600">From <input type="date" name="from" defaultValue={sp.from} className={filterInput} /></label>
        <label className="text-xs text-ink-600">To <input type="date" name="to" defaultValue={sp.to} className={filterInput} /></label>
      </FilterBar>
      <Table head={["Order", "Customer", "Delivery", "Status", "Payment", "Total"]} empty={rows.length === 0 && <p className="p-8 text-center text-sm text-ink-600">No orders match these filters.</p>}>
        {rows.map(({ o, email }) => (
          <tr key={o.id} className="hover:bg-canvas">
            <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-700 hover:underline">{o.orderNumber}</Link><span className="block text-xs text-ink-400">{o.createdAt.toLocaleString("en-GB")}</span></td>
            <td className={td}>{o.shipName}<span className="block text-xs text-ink-400">{email}</span></td>
            <td className={td}>{o.zoneName}<span className="block text-xs text-ink-400">{o.deliveryDate} · {o.deliverySlot}</span></td>
            <td className={td}><div className="flex flex-col items-start gap-2"><OrderStatusBadge status={o.status} /><QuickAdvance orderId={o.id} status={o.status} /></div></td>
            <td className={td}><PaymentStatusBadge status={o.paymentStatus} /><span className="block text-xs text-ink-400">{o.paymentMethod === "cod" ? "COD" : "Online"}</span></td>
            <td className={`${td} font-semibold tabular-nums`}>{formatMoney(o.total, settings.currencySymbol)}</td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={pages} href={qs} />
    </>
  );
}
