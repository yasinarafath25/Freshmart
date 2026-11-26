import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUserPage } from "@/lib/auth/guards";
import { getOrderForUser } from "@/lib/services/orders";
import { customerCanCancel } from "@/lib/services/pricing";
import { getSettings } from "@/lib/services/settings";
import { ButtonLink, Card } from "@/components/ui";
import { OrderStatusBadge, PaymentStatusBadge, StatusTimeline } from "@/components/store/OrderBits";
import { CancelOrderForm } from "@/components/store/AccountForms";
import { OrderItemsCard, OrderTotals } from "@/components/store/OrderSummary";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserPage(`/account/orders/${id}`);
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [order, settings] = await Promise.all([getOrderForUser(id, user.id), getSettings()]);
  if (!order) notFound();
  const cur = settings.currencySymbol;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/account/orders" className="text-sm text-ink-600 hover:text-brand-700">← All orders</Link>
          <h1 className="mt-1 text-2xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-sm text-ink-600">Placed {order.createdAt.toLocaleString("en-GB")}</p>
        </div>
        <div className="flex gap-2"><OrderStatusBadge status={order.status} /><PaymentStatusBadge status={order.paymentStatus} /></div>
      </div>
      <Card className="p-5"><StatusTimeline status={order.status} history={order.history} /></Card>
      {order.paymentMethod === "sslcommerz" && (order.paymentStatus === "pending" || order.paymentStatus === "failed") && order.status !== "cancelled" && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm">Online payment has not been completed yet.</p>
          <ButtonLink href={`/checkout/pay/${order.orderNumber}`} size="sm">Pay now</ButtonLink>
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <OrderItemsCard items={order.items} currency={cur} />
        <div className="space-y-4">
          <OrderTotals order={order} currency={cur} />
          <Card className="p-5 text-sm">
            <h2 className="font-semibold">Delivery</h2>
            <p className="mt-2">{order.shipName} · {order.shipPhone}</p>
            <p className="text-ink-600">{[order.shipLine1, order.shipLine2, order.shipArea, order.shipCity, order.shipPostalCode].filter(Boolean).join(", ")}</p>
            <p className="mt-2 text-ink-600">{order.zoneName} · {order.deliveryDate} · {order.deliverySlot}</p>
            {order.notes && <p className="mt-2 text-ink-600">Note: {order.notes}</p>}
          </Card>
          {customerCanCancel(order.status) && <CancelOrderForm orderId={order.id} />}
        </div>
      </div>
    </div>
  );
}
