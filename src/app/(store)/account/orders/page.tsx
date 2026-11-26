import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { requireUserPage } from "@/lib/auth/guards";
import { listUserOrders } from "@/lib/services/orders";
import { getSettings } from "@/lib/services/settings";
import { formatMoney } from "@/lib/utils/money";
import { ButtonLink, Card, EmptyState } from "@/components/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/store/OrderBits";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUserPage("/account/orders");
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [{ items, pages }, settings] = await Promise.all([listUserOrders(user.id, page, 10), getSettings()]);
  const cur = settings.currencySymbol;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My orders</h1>
      {items.length === 0 ? (
        <EmptyState icon={<Package className="size-7" />} title="No orders yet" body="When you place an order, it will appear here." action={<ButtonLink href="/shop">Shop now</ButtonLink>} />
      ) : (
        <Card className="divide-y divide-line">
          {items.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-canvas">
              <div>
                <p className="font-semibold text-brand-700">{o.orderNumber}</p>
                <p className="text-xs text-ink-600">{o.createdAt.toLocaleDateString("en-GB")} · {o.itemCount} items</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={o.status} />
                <PaymentStatusBadge status={o.paymentStatus} />
                <span className="w-24 text-right font-semibold tabular-nums">{formatMoney(o.total, cur)}</span>
              </div>
            </Link>
          ))}
        </Card>
      )}
      {pages > 1 && (
        <nav className="flex justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={`/account/orders?page=${n}`} aria-current={n === page ? "page" : undefined} className={`grid size-10 place-items-center rounded-xl text-sm font-semibold ${n === page ? "bg-brand-700 text-white" : "border border-line"}`}>{n}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}
