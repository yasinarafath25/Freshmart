import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import { requireUserPage } from "@/lib/auth/guards";
import { getOrderByNumberForUser } from "@/lib/services/orders";
import { getSettings } from "@/lib/services/settings";
import { getI18n } from "@/lib/i18n/server";
import { getDb } from "@/lib/db/client";
import { deliveryZones } from "@/lib/db/schema";
import { ButtonLink } from "@/components/ui";
import { OrderItemsCard, OrderTotals } from "@/components/store/OrderSummary";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.checkout.thanks, robots: { index: false } };
}

export default async function SuccessPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const user = await requireUserPage(`/checkout/success/${orderNumber}`);
  const [order, settings, i] = await Promise.all([getOrderByNumberForUser(orderNumber.slice(0, 30), user.id), getSettings(), getI18n()]);
  if (!order) notFound();
  const t = i.d.checkout;
  const zone = order.zoneId ? await getDb().query.deliveryZones.findFirst({ where: eq(deliveryZones.id, order.zoneId) }) : null;
  return (
    <div className="container-page max-w-4xl py-10">
      <div className="rounded-3xl bg-mint-50 p-8 text-center">
        <CheckCircle2 className="mx-auto size-14 text-leaf-500" aria-hidden />
        <h1 className="mt-3 text-3xl font-bold">{t.thanks}</h1>
        <p className="mt-2 text-ink-600">
          {t.orderLine(order.orderNumber, order.deliveryDate ? i.date(order.deliveryDate, { day: "numeric", month: "long", timeZone: "UTC" }) : "", i.slot(order.deliverySlot ?? ""), i.pick(order.zoneName ?? "", zone?.nameBn))}
        </p>
        <p className="mt-1 text-sm text-ink-600">{order.paymentMethod === "cod" ? t.keepCash : order.paymentStatus === "paid" ? t.paid : t.payPending}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href={`/account/orders/${order.id}`}>{t.track}</ButtonLink>
          <ButtonLink href="/shop" variant="secondary">{t.continue}</ButtonLink>
        </div>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_300px]">
        <OrderItemsCard items={order.items} currency={settings.currencySymbol} lang={i.lang} />
        <OrderTotals order={order} currency={settings.currencySymbol} lang={i.lang} />
      </div>
    </div>
  );
}
