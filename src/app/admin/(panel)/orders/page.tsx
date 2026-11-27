import Link from "next/link";
import { and, desc, eq, gte, ilike, lt, or, sql, type SQL } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { orderStatus, orders, paymentStatus, users } from "@/lib/db/schema";
import { getI18n } from "@/lib/i18n/server";
import { DICTS } from "@/lib/i18n/dict";
import { ShoppingCart } from "lucide-react";
import { EmptyBlock, FilterBar, NoAccess, PageHeader, Pager, Table, filterInput, td } from "@/components/admin/ui";
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
  const [rows, count, { t, money, num, lang, dateTime, slot }] = await Promise.all([
    db.select({ o: orders, email: users.email }).from(orders).innerJoin(users, eq(users.id, orders.userId)).where(where).orderBy(desc(orders.createdAt)).limit(per).offset((page - 1) * per),
    db.select({ n: sql<number>`count(*)::int` }).from(orders).innerJoin(users, eq(users.id, orders.userId)).where(where),
    getI18n(),
  ]);
  const od = DICTS[lang].order;
  const pages = Math.max(1, Math.ceil((count[0]?.n ?? 0) / per));
  const qs = (n: number) => `/admin/orders?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([, v]) => v)), page: String(n) })}`;

  return (
    <>
      <PageHeader title={t("Orders", "অর্ডার")} description={t(`${count[0]?.n ?? 0} orders. New orders are marked “Pending” — confirm them with one click.`, `মোট ${num(count[0]?.n ?? 0)}টি অর্ডার। নতুন অর্ডার “অপেক্ষমাণ” থাকে — এক ক্লিকে নিশ্চিত করুন।`)} />
      <nav aria-label={t("Quick filters", "দ্রুত ফিল্টার")} className="mb-3 flex flex-wrap gap-2">
        {[["", t("All", "সব")], ...orderStatus.enumValues.map((s) => [s, od.status[s]])].map(([s, l]) => (
          <Link key={s} href={s ? `/admin/orders?status=${s}` : "/admin/orders"} aria-current={(sp.status ?? "") === s ? "page" : undefined} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${(sp.status ?? "") === s ? "bg-brand-700 text-white" : "border border-line bg-white text-ink-600 hover:border-brand-600 hover:text-brand-700"}`}>{l}</Link>
        ))}
      </nav>
      <FilterBar action="/admin/orders">
        <input name="q" defaultValue={sp.q} placeholder={t("Order #, name, phone, email", "অর্ডার নম্বর, নাম, ফোন, ইমেইল")} className={`${filterInput} w-full sm:w-64`} aria-label={t("Search orders", "অর্ডার খুঁজুন")} />
        <select name="status" defaultValue={sp.status ?? ""} className={filterInput} aria-label={t("Status", "অবস্থা")}>
          <option value="">{t("All statuses", "সব অবস্থা")}</option>
          {orderStatus.enumValues.map((s) => <option key={s} value={s}>{od.status[s]}</option>)}
        </select>
        <select name="payment" defaultValue={sp.payment ?? ""} className={filterInput} aria-label={t("Payment status", "পেমেন্টের অবস্থা")}>
          <option value="">{t("All payments", "সব পেমেন্ট")}</option>
          {paymentStatus.enumValues.map((s) => <option key={s} value={s}>{(od.pay as Record<string, string>)[s] ?? s}</option>)}
        </select>
        <label className="text-xs text-ink-600">{t("From", "শুরু")} <input type="date" name="from" defaultValue={sp.from} className={filterInput} /></label>
        <label className="text-xs text-ink-600">{t("To", "শেষ")} <input type="date" name="to" defaultValue={sp.to} className={filterInput} /></label>
      </FilterBar>
      <Table head={[t("Order", "অর্ডার"), t("Customer", "গ্রাহক"), t("Delivery", "ডেলিভারি"), t("Status", "অবস্থা"), t("Payment", "পেমেন্ট"), t("Total", "মোট")]} empty={rows.length === 0 && <EmptyBlock icon={<ShoppingCart className="size-7" aria-hidden />} title={t("No orders here", "এখানে কোনো অর্ডার নেই")} body={t("Try another filter, or clear the search.", "অন্য ফিল্টার দিন, অথবা খোঁজা মুছে দিন।")} />}>
        {rows.map(({ o, email }) => (
          <tr key={o.id} className={`hover:bg-canvas ${o.status === "pending" ? "bg-amber-50/50" : ""}`}>
            <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-700 hover:underline">{o.orderNumber}</Link><span className="block text-xs text-ink-400">{dateTime(o.createdAt)}</span></td>
            <td className={td}>{o.shipName}<span className="block text-xs text-ink-400">{o.shipPhone}</span><span className="block text-xs text-ink-400">{email}</span></td>
            <td className={td}>{o.zoneName}<span className="block text-xs text-ink-400">{o.deliveryDate} · {o.deliverySlot ? slot(o.deliverySlot) : ""}</span></td>
            <td className={td}><div className="flex flex-col items-start gap-2"><OrderStatusBadge status={o.status} lang={lang} /><QuickAdvance orderId={o.id} status={o.status} /></div></td>
            <td className={td}><PaymentStatusBadge status={o.paymentStatus} lang={lang} /><span className="block text-xs text-ink-400">{o.paymentMethod === "cod" ? t("Cash on delivery", "ক্যাশ অন ডেলিভারি") : t("Online", "অনলাইন")}</span></td>
            <td className={`${td} font-semibold tabular-nums`}>{money(o.total)}</td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={pages} href={qs} />
    </>
  );
}
