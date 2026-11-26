import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUserPage } from "@/lib/auth/guards";
import { getOrderForUser } from "@/lib/services/orders";
import { customerCanCancel } from "@/lib/services/pricing";
import { getSettings } from "@/lib/services/settings";
import { getI18n } from "@/lib/i18n/server";
import { getDb } from "@/lib/db/client";
import { deliveryZones } from "@/lib/db/schema";
import { ButtonLink, Card } from "@/components/ui";
import { OrderStatusBadge, PaymentStatusBadge, StatusTimeline } from "@/components/store/OrderBits";
import { CancelOrderForm } from "@/components/store/AccountForms";
import { OrderItemsCard, OrderTotals } from "@/components/store/OrderSummary";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.account.orders, robots: { index: false } };
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserPage(`/account/orders/${id}`);
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [order, settings, i] = await Promise.all([getOrderForUser(id, user.id), getSettings(), getI18n()]);
  if (!order) notFound();
  const o = i.d.order;
  const cur = settings.currencySymbol;
  const zone = order.zoneId ? await getDb().query.deliveryZones.findFirst({ where: eq(deliveryZones.id, order.zoneId) }) : null;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/account/orders" className="text-sm text-ink-600 hover:text-brand-700">{o.allOrders}</Link>
          <h1 className="mt-1 text-2xl font-bold">{o.orderNo(order.orderNumber)}</h1>
          <p className="text-sm text-ink-600">{o.placed(i.dateTime(order.createdAt))}</p>
        </div>
        <div className="flex gap-2"><OrderStatusBadge status={order.status} lang={i.lang} /><PaymentStatusBadge status={order.paymentStatus} lang={i.lang} /></div>
      </div>
      <Card className="p-5"><StatusTimeline status={order.status} history={order.history} lang={i.lang} /></Card>
      {order.paymentMethod === "sslcommerz" && (order.paymentStatus === "pending" || order.paymentStatus === "failed") && order.status !== "cancelled" && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm">{o.notPaid}</p>
          <ButtonLink href={`/checkout/pay/${order.orderNumber}`} size="sm">{o.payNow}</ButtonLink>
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <OrderItemsCard items={order.items} currency={cur} lang={i.lang} />
        <div className="space-y-4">
          <OrderTotals order={order} currency={cur} lang={i.lang} />
          <Card className="p-5 text-sm">
            <h2 className="font-semibold">{o.deliveryTitle}</h2>
            <p className="mt-2">{order.shipName} · {order.shipPhone}</p>
            <p className="text-ink-600">{[order.shipLine1, order.shipLine2, order.shipArea, order.shipCity, order.shipPostalCode].filter(Boolean).join(", ")}</p>
            <p className="mt-2 text-ink-600">
              {i.pick(order.zoneName ?? "", zone?.nameBn)} · {order.deliveryDate ? i.date(order.deliveryDate, { day: "numeric", month: "short", timeZone: "UTC" }) : ""} · {i.slot(order.deliverySlot ?? "")}
            </p>
            {order.notes && <p className="mt-2 text-ink-600">{o.note}: {order.notes}</p>}
          </Card>
          {customerCanCancel(order.status) && <CancelOrderForm orderId={order.id} />}
        </div>
      </div>
    </div>
  );
}
