import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { orders, users } from "@/lib/db/schema";
import { loadOrderDetail } from "@/lib/services/orders";
import { canTransition } from "@/lib/services/pricing";
import { getSettings } from "@/lib/services/settings";
import { getI18n } from "@/lib/i18n/server";
import { NoAccess, PageHeader } from "@/components/admin/ui";
import { Card } from "@/components/ui";
import { OrderStatusBadge, PaymentStatusBadge, StatusTimeline } from "@/components/store/OrderBits";
import { OrderItemsCard, OrderTotals } from "@/components/store/OrderSummary";
import { MarkPaid, StatusControl } from "@/components/admin/OrderControls";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requireStaffPage("orders:write");
  if (!allowed) return <NoAccess />;
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const db = getDb();
  const o = await db.query.orders.findFirst({ where: eq(orders.id, id) });
  if (!o) notFound();
  const [order, customer, settings, { t, money, lang, dateTime, slot }] = await Promise.all([loadOrderDetail(o), db.query.users.findFirst({ where: eq(users.id, o.userId) }), getSettings(), getI18n()]);
  const cur = settings.currencySymbol;
  const next = (["confirmed", "processing", "out_for_delivery", "delivered", "cancelled"] as const).filter((s) => canTransition(order.status, s));

  return (
    <>
      <PageHeader back={{ href: "/admin/orders", label: t("Orders", "অর্ডার") }} title={t(`Order ${order.orderNumber}`, `অর্ডার ${order.orderNumber}`)} description={t(`Placed ${dateTime(order.createdAt)}`, `অর্ডারের সময় ${dateTime(order.createdAt)}`)} actions={<><OrderStatusBadge status={order.status} lang={lang} /><PaymentStatusBadge status={order.paymentStatus} lang={lang} /></>} />
      <Card className="mb-6 p-5"><StatusTimeline status={order.status} history={order.history} lang={lang} /></Card>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <OrderItemsCard items={order.items} currency={cur} lang={lang} />
          <Card className="p-5">
            <h2 className="font-semibold">{t("History", "ইতিহাস")}</h2>
            <ol className="mt-3 space-y-3 text-sm">
              {order.history.map((h) => (
                <li key={h.id} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-leaf-500" aria-hidden />
                  <span><OrderStatusBadge status={h.status} lang={lang} /> <span className="text-ink-400">{dateTime(h.createdAt)}</span>{h.note && <span className="block text-ink-600">{h.note}</span>}</span>
                </li>
              ))}
            </ol>
          </Card>
          {order.payments.length > 0 && (
            <Card className="p-5 text-sm">
              <h2 className="font-semibold">{t("Payment records", "পেমেন্টের হিসাব")}</h2>
              <ul className="mt-3 divide-y divide-line">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span>{p.provider.toUpperCase()} · {p.transactionId}</span>
                    <span className="tabular-nums">{money(p.amount)} · {p.status}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        <div className="space-y-4">
          <Card className={`p-5 ${order.status === "pending" ? "ring-2 ring-sun-400" : ""}`}><h2 className="mb-1 font-semibold">{t("Update status", "অবস্থা বদলান")}</h2>{order.status === "pending" && <p className="mb-3 text-sm text-amber-800">{t("New order — confirm it so the customer knows it’s accepted.", "নতুন অর্ডার — নিশ্চিত করুন, যাতে গ্রাহক জানতে পারেন অর্ডারটি গ্রহণ হয়েছে।")}</p>}<StatusControl orderId={order.id} status={order.status} next={[...next]} /></Card>
          {order.paymentMethod === "cod" && order.paymentStatus !== "paid" && order.status !== "cancelled" && <Card className="p-5"><h2 className="mb-3 font-semibold">{t("Cash on delivery", "ক্যাশ অন ডেলিভারি")}</h2><MarkPaid orderId={order.id} /></Card>}
          <OrderTotals order={order} currency={cur} lang={lang} />
          <Card className="p-5 text-sm">
            <h2 className="font-semibold">{t("Customer", "গ্রাহক")}</h2>
            <p className="mt-2">{customer?.name}</p>
            <p className="text-ink-600">{customer?.email}</p>
            <h3 className="mt-4 font-semibold">{t("Deliver to", "ডেলিভারির ঠিকানা")}</h3>
            <p className="mt-1">{order.shipName} · <a href={`tel:${order.shipPhone}`} className="text-brand-700">{order.shipPhone}</a></p>
            <p className="text-ink-600">{[order.shipLine1, order.shipLine2, order.shipArea, order.shipCity, order.shipPostalCode].filter(Boolean).join(", ")}</p>
            <p className="mt-2 text-ink-600">{order.zoneName} · {order.deliveryDate} · {order.deliverySlot ? slot(order.deliverySlot) : ""}</p>
            {order.notes && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-amber-900">{t("Note", "নোট")}: {order.notes}</p>}
          </Card>
        </div>
      </div>
    </>
  );
}
