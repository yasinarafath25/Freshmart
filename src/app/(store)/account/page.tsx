import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, isNull } from "drizzle-orm";
import { Bell, Heart, Package, ShoppingBag } from "lucide-react";
import { requireUserPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { notifications, orders, wishlistItems } from "@/lib/db/schema";
import { listUserOrders } from "@/lib/services/orders";
import { getSettings } from "@/lib/services/settings";
import { formatMoney } from "@/lib/utils/money";
import { Card, ButtonLink } from "@/components/ui";
import { OrderStatusBadge } from "@/components/store/OrderBits";
import { markNotificationsReadAction } from "@/app/actions/account";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUserPage("/account");
  const db = getDb();
  const [settings, recent, notes, orderCount, wishCount, unread] = await Promise.all([
    getSettings(),
    listUserOrders(user.id, 1, 3),
    db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(6),
    db.$count(orders, eq(orders.userId, user.id)),
    db.$count(wishlistItems, eq(wishlistItems.userId, user.id)),
    db.$count(notifications, and(eq(notifications.userId, user.id), isNull(notifications.readAt))),
  ]);
  const cur = settings.currencySymbol;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hello, {user.name.split(" ")[0]}</h1>
        <p className="text-ink-600">Here is what is happening with your account.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Orders", value: orderCount, Icon: Package, href: "/account/orders" },
          { label: "Wishlist", value: wishCount, Icon: Heart, href: "/account/wishlist" },
          { label: "Unread updates", value: unread, Icon: Bell, href: "#updates" },
        ].map(({ label, value, Icon, href }) => (
          <Link key={label} href={href} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5 shadow-card transition hover:shadow-card-hover">
            <span className="grid size-12 place-items-center rounded-xl bg-mint-50 text-brand-700"><Icon className="size-6" aria-hidden /></span>
            <span>
              <span className="block text-2xl font-bold tabular-nums">{value}</span>
              <span className="text-sm text-ink-600">{label}</span>
            </span>
          </Link>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>
        </div>
        {recent.items.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3 py-6 text-center">
            <ShoppingBag className="size-10 text-ink-400" aria-hidden />
            <p className="text-ink-600">You have not placed any orders yet.</p>
            <ButtonLink href="/shop" size="sm">Start shopping</ButtonLink>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {recent.items.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-brand-700">
                  <span>
                    <span className="font-semibold">{o.orderNumber}</span>
                    <span className="ml-2 text-sm text-ink-600">{o.createdAt.toLocaleDateString("en-GB")} · {o.itemCount} items</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <OrderStatusBadge status={o.status} />
                    <span className="font-semibold tabular-nums">{formatMoney(o.total, cur)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5" id="updates">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Updates</h2>
          {unread > 0 && (
            <form action={markNotificationsReadAction}>
              <button className="text-sm font-semibold text-brand-700 hover:underline">Mark all as read</button>
            </form>
          )}
        </div>
        {notes.length === 0 ? (
          <p className="mt-3 text-sm text-ink-600">No updates yet. We will notify you here when your orders change.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notes.map((n) => (
              <li key={n.id} className={`rounded-xl p-3 text-sm ${n.readAt ? "bg-canvas" : "bg-mint-50"}`}>
                {n.link ? <Link href={n.link} className="font-semibold hover:text-brand-700">{n.title}</Link> : <p className="font-semibold">{n.title}</p>}
                <p className="text-ink-600">{n.body}</p>
                <p className="mt-1 text-xs text-ink-400">{n.createdAt.toLocaleString("en-GB")}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
