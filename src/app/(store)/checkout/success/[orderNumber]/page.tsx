import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { requireUserPage } from "@/lib/auth/guards";
import { getOrderByNumberForUser } from "@/lib/services/orders";
import { getSettings } from "@/lib/services/settings";
import { ButtonLink } from "@/components/ui";
import { OrderItemsCard, OrderTotals } from "@/components/store/OrderSummary";

export const metadata: Metadata = { title: "Order placed", robots: { index: false } };

export default async function SuccessPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const user = await requireUserPage(`/checkout/success/${orderNumber}`);
  const [order, settings] = await Promise.all([getOrderByNumberForUser(orderNumber.slice(0, 30), user.id), getSettings()]);
  if (!order) notFound();
  return (
    <div className="container-page max-w-4xl py-10">
      <div className="rounded-3xl bg-mint-50 p-8 text-center">
        <CheckCircle2 className="mx-auto size-14 text-leaf-500" aria-hidden />
        <h1 className="mt-3 text-3xl font-bold">Thank you! Your order is placed.</h1>
        <p className="mt-2 text-ink-600">
          Order <strong className="text-ink-900">{order.orderNumber}</strong> · Delivery {order.deliveryDate} ({order.deliverySlot}) to {order.zoneName}
        </p>
        <p className="mt-1 text-sm text-ink-600">
          {order.paymentMethod === "cod" ? "Please keep the exact cash ready at delivery." : order.paymentStatus === "paid" ? "Payment received — thank you." : "Payment is pending."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href={`/account/orders/${order.id}`}>Track order</ButtonLink>
          <ButtonLink href="/shop" variant="secondary">Continue shopping</ButtonLink>
        </div>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_300px]">
        <OrderItemsCard items={order.items} currency={settings.currencySymbol} />
        <OrderTotals order={order} currency={settings.currencySymbol} />
      </div>
    </div>
  );
}
