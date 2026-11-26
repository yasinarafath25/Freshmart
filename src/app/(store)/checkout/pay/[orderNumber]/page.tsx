import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireUserPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import { initiateSslcommerz } from "@/lib/services/payments";
import { Alert, ButtonLink } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Payment", robots: { index: false } };

export default async function PayPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const user = await requireUserPage(`/checkout/pay/${orderNumber}`);
  const order = await getDb().query.orders.findFirst({ where: and(eq(orders.orderNumber, orderNumber.slice(0, 30)), eq(orders.userId, user.id)) });
  if (!order) notFound();
  if (order.paymentStatus === "paid") redirect(`/checkout/success/${order.orderNumber}`);
  if (order.paymentMethod !== "sslcommerz" || order.status === "cancelled") redirect(`/account/orders/${order.id}`);
  const res = await initiateSslcommerz(order);
  if ("url" in res) redirect(res.url);
  const i = await getI18n();
  return (
    <div className="container-page max-w-xl py-16">
      <Alert tone="error">{i.msg(res.error)}</Alert>
      <div className="mt-6 flex gap-3">
        <ButtonLink href={`/account/orders/${order.id}`}>{i.d.checkout.viewOrder}</ButtonLink>
        <ButtonLink href="/contact" variant="secondary">{i.d.checkout.contactSupport}</ButtonLink>
      </div>
    </div>
  );
}
