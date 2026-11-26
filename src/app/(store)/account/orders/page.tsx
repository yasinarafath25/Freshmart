import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { requireUserPage } from "@/lib/auth/guards";
import { listUserOrders } from "@/lib/services/orders";
import { getI18n } from "@/lib/i18n/server";
import { ButtonLink, Card, EmptyState } from "@/components/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/store/OrderBits";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.account.orders, robots: { index: false } };
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUserPage("/account/orders");
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [{ items, pages }, i] = await Promise.all([listUserOrders(user.id, page, 10), getI18n()]);
  const a = i.d.account;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{a.orders}</h1>
      {items.length === 0 ? (
        <EmptyState icon={<Package className="size-7" />} title={a.noOrdersTitle} body={a.noOrdersBody} action={<ButtonLink href="/shop">{a.shopNow}</ButtonLink>} />
      ) : (
        <Card className="divide-y divide-line">
          {items.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-canvas">
              <div>
                <p className="font-semibold text-brand-700">{o.orderNumber}</p>
                <p className="text-xs text-ink-600">{i.date(o.createdAt)} · {a.itemsCount(i.num(o.itemCount))}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={o.status} lang={i.lang} />
                <PaymentStatusBadge status={o.paymentStatus} lang={i.lang} />
                <span className="w-24 text-right font-semibold tabular-nums">{i.money(o.total)}</span>
              </div>
            </Link>
          ))}
        </Card>
      )}
      {pages > 1 && (
        <nav className="flex justify-center gap-2" aria-label={i.d.catalog.pagination}>
          {Array.from({ length: pages }, (_, n) => n + 1).map((n) => (
            <Link key={n} href={`/account/orders?page=${n}`} aria-current={n === page ? "page" : undefined} className={`grid size-11 place-items-center rounded-xl text-sm font-semibold ${n === page ? "bg-brand-700 text-white" : "border border-line"}`}>{i.num(n)}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}
