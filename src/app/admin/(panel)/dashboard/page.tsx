import Link from "next/link";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import {
  AlertTriangle, ArrowRight, Banknote, CheckCircle2, Circle, Clock, ExternalLink, Inbox, Package, PartyPopper, Plus, ShoppingBag, ShoppingCart, Star,
  TicketPercent, TrendingUp, Users,
} from "lucide-react";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { categories, contactMessages, coupons, deliveryZones, orders, products, reviews, users } from "@/lib/db/schema";
import { lowStockList, overview, salesByDay, topProducts } from "@/lib/services/reports";
import { getSettings } from "@/lib/services/settings";
import { telegramStatus } from "@/lib/services/telegram";
import { storeDate } from "@/lib/utils/dates";
import { getI18n } from "@/lib/i18n/server";
import { EmptyBlock, NoAccess, StatCard, Table, td } from "@/components/admin/ui";
import { BarChart, RankBars } from "@/components/admin/Chart";
import { Card } from "@/components/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/store/OrderBits";
import { QuickAdvance } from "@/components/admin/OrderControls";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { allowed, user } = await requireStaffPage("dashboard:read");
  if (!allowed) return <NoAccess />;
  const [settings, i] = await Promise.all([getSettings(), getI18n()]);
  const { t, money, num, lang, dateTime } = i;
  const tz = settings.timeZone;
  const last14 = { from: storeDate(tz, -13), to: storeDate(tz), tz };
  const last30 = { from: storeDate(tz, -29), to: storeDate(tz), tz };
  const db = getDb();
  const now = new Date();
  const [stats, days, top, low, latest, newMessages, pendingReviews, productCount, activeProducts, categoryCount, zoneCount, couponCount] = await Promise.all([
    overview(settings.lowStockThreshold, tz),
    salesByDay(last14),
    topProducts(last30, 5),
    lowStockList(settings.lowStockThreshold, 6),
    db.select({ o: orders, customer: users.name }).from(orders).innerJoin(users, eq(users.id, orders.userId)).orderBy(desc(orders.createdAt)).limit(6),
    db.$count(contactMessages, eq(contactMessages.isHandled, false)),
    db.$count(reviews, eq(reviews.status, "pending")),
    db.$count(products),
    db.$count(products, eq(products.isActive, true)),
    db.$count(categories),
    db.$count(deliveryZones, eq(deliveryZones.isActive, true)),
    db.$count(coupons, and(eq(coupons.isActive, true), or(isNull(coupons.endsAt), gt(coupons.endsAt, now)))),
  ]);

  // Greeting by the store's local hour.
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(now));
  const greet = hour < 12 ? t("Good morning", "শুভ সকাল") : hour < 17 ? t("Good afternoon", "শুভ দুপুর") : t("Good evening", "শুভ সন্ধ্যা");
  const today = new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(now);
  const short = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const hasSales = days.some((d) => d.orders > 0);
  const firstName = user.name.split(" ")[0];

  const setup = [
    { done: activeProducts > 0, label: t(`Add products (${productCount} added)`, `পণ্য যোগ করুন (${num(productCount)}টি আছে)`), href: "/admin/products/create" },
    { done: zoneCount > 0, label: t("Set delivery areas & fees", "ডেলিভারি এলাকা ও চার্জ ঠিক করুন"), href: "/admin/delivery" },
    { done: !!settings.supportPhone, label: t("Add your shop phone number", "দোকানের ফোন নম্বর দিন"), href: "/admin/settings" },
    { done: telegramStatus().ready, label: t("Connect Telegram order alerts", "টেলিগ্রামে অর্ডারের খবর চালু করুন"), href: "/admin/settings" },
    { done: stats.orders30 > 0 || latest.length > 0, label: t("Receive your first order", "প্রথম অর্ডার পান"), href: "/" },
  ];
  const setupDone = setup.filter((s) => s.done).length;

  const attention = [
    { n: stats.pending, href: "/admin/orders?status=pending", icon: Clock, tone: "amber", label: t("New orders to confirm", "নিশ্চিত করার অপেক্ষায় অর্ডার"), cta: t("Confirm now", "এখনই নিশ্চিত করুন") },
    { n: stats.lowStock, href: "/admin/inventory?low=1", icon: AlertTriangle, tone: "red", label: t("Items running low", "স্টক কমে গেছে"), cta: t("Restock", "স্টক বাড়ান") },
    { n: newMessages, href: "/admin/messages", icon: Inbox, tone: "sky", label: t("Unread messages", "না-পড়া মেসেজ"), cta: t("Read", "পড়ুন") },
    { n: pendingReviews, href: "/admin/reviews", icon: Star, tone: "violet", label: t("Reviews to approve", "অনুমোদনের অপেক্ষায় রিভিউ"), cta: t("Review", "দেখুন") },
  ];
  const toneCls: Record<string, string> = {
    amber: "border-amber-200 bg-amber-50 text-amber-900 [&_.ic]:bg-sun-400 [&_.ic]:text-ink-900",
    red: "border-red-200 bg-red-50 text-red-900 [&_.ic]:bg-tomato-500 [&_.ic]:text-white",
    sky: "border-sky-200 bg-sky-50 text-sky-900 [&_.ic]:bg-sky-600 [&_.ic]:text-white",
    violet: "border-violet-200 bg-violet-50 text-violet-900 [&_.ic]:bg-violet-600 [&_.ic]:text-white",
  };
  const allClear = attention.every((a) => a.n === 0);

  const quick = [
    { href: "/admin/products/create", icon: Plus, label: t("Add product", "পণ্য যোগ করুন") },
    { href: "/admin/orders", icon: ShoppingCart, label: t("All orders", "সব অর্ডার") },
    { href: "/admin/coupons", icon: TicketPercent, label: t("Create offer", "অফার তৈরি করুন") },
    { href: "/", icon: ExternalLink, label: t("View store", "স্টোর দেখুন"), external: true },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-lime-400/15 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 right-24 size-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm text-lime-300">{today}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{greet}, {firstName} 👋</h1>
            <p className="mt-2 max-w-xl text-white/80">
              {stats.pending > 0
                ? t(`You have ${stats.pending} new order${stats.pending > 1 ? "s" : ""} waiting for confirmation.`, `${num(stats.pending)}টি নতুন অর্ডার আপনার নিশ্চিত করার অপেক্ষায় আছে।`)
                : t("You're all caught up. Here's how your shop is doing.", "সব কাজ শেষ! আপনার দোকানের অবস্থা এক নজরে দেখুন।")}
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
            {quick.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                target={q.external ? "_blank" : undefined}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/10 px-3 py-3 text-center text-sm font-semibold ring-1 ring-white/15 backdrop-blur transition hover:bg-white hover:text-brand-900"
              >
                <q.icon className="size-5" aria-hidden />
                {q.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Needs attention */}
      <section aria-labelledby="attn">
        <h2 id="attn" className="mb-3 text-lg font-bold">{t("Needs your attention", "আপনার নজর দরকার")}</h2>
        {allClear ? (
          <Card className="flex items-center gap-4 border-brand-100 bg-mint-50 p-5">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-700 text-white"><PartyPopper className="size-6" aria-hidden /></span>
            <div>
              <p className="font-semibold text-brand-900">{t("Nothing waiting — great job!", "কোনো কাজ বাকি নেই — দারুণ!")}</p>
              <p className="text-sm text-ink-600">{t("New orders, low stock, messages and reviews will show up here.", "নতুন অর্ডার, কম স্টক, মেসেজ আর রিভিউ এখানে দেখাবে।")}</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {attention.map((a) => (
              <Link key={a.href} href={a.href} className={cn("group flex items-center gap-4 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md", a.n > 0 ? toneCls[a.tone] : "border-line bg-white text-ink-600 opacity-80 [&_.ic]:bg-canvas [&_.ic]:text-ink-400")}>
                <span className="ic grid size-12 shrink-0 place-items-center rounded-2xl"><a.icon className="size-6" aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-3xl font-bold tabular-nums leading-none">{num(a.n)}</p>
                  <p className="mt-1 text-sm font-medium">{a.label}</p>
                </div>
                {a.n > 0 && <span className="hidden items-center gap-1 text-xs font-bold group-hover:flex">{a.cta}<ArrowRight className="size-3.5" aria-hidden /></span>}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("Key numbers", "মূল হিসাব")}>
        <StatCard label={t("Sales today", "আজকের বিক্রি")} value={money(stats.revenueToday)} sub={t(`${stats.ordersToday} orders`, `${num(stats.ordersToday)}টি অর্ডার`)} icon={<Banknote className="size-6" />} />
        <StatCard label={t("Sales · last 30 days", "বিক্রি · গত ৩০ দিন")} value={money(stats.revenue30)} sub={t(`${money(stats.collected30)} collected`, `${money(stats.collected30)} হাতে এসেছে`)} icon={<TrendingUp className="size-6" />} tone="blue" />
        <StatCard label={t("Orders · last 30 days", "অর্ডার · গত ৩০ দিন")} value={num(stats.orders30)} sub={t(`Avg. order ${money(stats.aov30)}`, `গড় অর্ডার ${money(stats.aov30)}`)} icon={<ShoppingBag className="size-6" />} tone="purple" />
        <StatCard label={t("Customers", "গ্রাহক")} value={num(stats.customers)} sub={t(`${activeProducts} products · ${categoryCount} categories · ${couponCount} live offers`, `${num(activeProducts)}টি পণ্য · ${num(categoryCount)}টি ক্যাটাগরি · ${num(couponCount)}টি অফার`)} icon={<Users className="size-6" />} tone="yellow" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          {/* Chart */}
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold">{t("Sales · last 14 days", "বিক্রি · গত ১৪ দিন")}</h2>
              <p className="text-sm text-ink-600">{t("Total", "মোট")} <span className="font-bold text-ink-900">{money(days.reduce((s, d) => s + d.revenue, 0))}</span> · {num(days.reduce((s, d) => s + d.orders, 0))} {t("orders", "অর্ডার")}</p>
            </div>
            {hasSales ? (
              <div className="mt-5"><BarChart label={t("Sales per day", "প্রতিদিনের বিক্রি")} data={days.map((d) => ({ key: d.day, label: short(d.day), value: d.revenue }))} format={money} height={200} /></div>
            ) : (
              <EmptyBlock
                icon={<TrendingUp className="size-7" aria-hidden />}
                title={t("Your sales chart will appear here", "এখানে আপনার বিক্রির চার্ট দেখাবে")}
                body={t("As soon as orders come in, you'll see daily sales for the last 14 days.", "অর্ডার আসা শুরু হলেই গত ১৪ দিনের প্রতিদিনের বিক্রি এখানে দেখতে পাবেন।")}
              />
            )}
          </Card>

          {/* Latest orders */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("Latest orders", "সাম্প্রতিক অর্ডার")}</h2>
              <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">{t("View all", "সব দেখুন")} <ArrowRight className="size-4" aria-hidden /></Link>
            </div>
            {latest.length === 0 ? (
              <Card>
                <EmptyBlock
                  icon={<ShoppingCart className="size-7" aria-hidden />}
                  title={t("No orders yet", "এখনো কোনো অর্ডার আসেনি")}
                  body={t("Share your store link with customers. New orders show up here, and you'll also get a Telegram alert.", "আপনার স্টোরের লিংক গ্রাহকদের সাথে শেয়ার করুন। নতুন অর্ডার এখানে দেখাবে, আর টেলিগ্রামেও খবর পাবেন।")}
                  action={<Link href="/" target="_blank" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"><ExternalLink className="size-4" aria-hidden />{t("Open my store", "আমার স্টোর খুলুন")}</Link>}
                />
              </Card>
            ) : (
              <Table head={[t("Order", "অর্ডার"), t("Customer", "গ্রাহক"), t("Status", "অবস্থা"), t("Payment", "পেমেন্ট"), t("Total", "মোট")]}>
                {latest.map(({ o, customer }) => (
                  <tr key={o.id} className={cn("hover:bg-canvas", o.status === "pending" && "bg-amber-50/50")}>
                    <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-700 hover:underline">{o.orderNumber}</Link><span className="block text-xs text-ink-400">{dateTime(o.createdAt)}</span></td>
                    <td className={td}>{customer}<span className="block text-xs text-ink-400">{o.shipPhone}</span></td>
                    <td className={td}><div className="flex flex-col items-start gap-2"><OrderStatusBadge status={o.status} lang={lang} /><QuickAdvance orderId={o.id} status={o.status} /></div></td>
                    <td className={td}><PaymentStatusBadge status={o.paymentStatus} lang={lang} /></td>
                    <td className={`${td} font-semibold tabular-nums`}>{money(o.total)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Setup checklist */}
          {setupDone < setup.length && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">{t("Get your shop ready", "দোকান প্রস্তুত করুন")}</h2>
                <span className="text-sm font-semibold text-brand-700">{num(setupDone)}/{num(setup.length)}</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-canvas"><div className="h-full rounded-full bg-gradient-to-r from-leaf-500 to-lime-400" style={{ width: `${(setupDone / setup.length) * 100}%` }} /></div>
              <ul className="mt-4 space-y-1">
                {setup.map((s) => (
                  <li key={s.label}>
                    <Link href={s.href} className={cn("flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition hover:bg-canvas", s.done ? "text-ink-400 line-through" : "font-medium text-ink-900")}>
                      {s.done ? <CheckCircle2 className="size-5 shrink-0 text-leaf-500" aria-hidden /> : <Circle className="size-5 shrink-0 text-ink-400" aria-hidden />}
                      <span className="flex-1">{s.label}</span>
                      {!s.done && <ArrowRight className="size-4 text-ink-400" aria-hidden />}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="mb-4 font-bold">{t("Best sellers · 30 days", "সবচেয়ে বেশি বিক্রি · ৩০ দিন")}</h2>
            {top.length ? (
              <RankBars rows={top.map((x) => ({ label: x.name, value: x.revenue, sub: t(`· ${x.units} sold`, `· ${num(x.units)}টি`) }))} format={money} />
            ) : (
              <p className="flex items-center gap-2 text-sm text-ink-600"><Package className="size-4 text-ink-400" aria-hidden />{t("Your top products will show here after the first sales.", "প্রথম বিক্রির পর সবচেয়ে জনপ্রিয় পণ্যগুলো এখানে দেখাবে।")}</p>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">{t("Low stock", "স্টক কম")}</h2>
              <Link href="/admin/inventory?low=1" className="text-sm font-semibold text-brand-700 hover:underline">{t("Manage", "ঠিক করুন")}</Link>
            </div>
            {low.length ? (
              <ul className="divide-y divide-line text-sm">
                {low.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/admin/products/${l.productId}/edit`} className="min-w-0 truncate hover:text-brand-700">{l.product} <span className="text-ink-400">· {l.variant}</span></Link>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums", l.stock === 0 ? "bg-red-50 text-tomato-600" : "bg-amber-50 text-amber-800")}>
                      {l.stock === 0 ? t("Sold out", "শেষ") : t(`${l.stock} left`, `${num(l.stock)}টি বাকি`)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 text-sm text-ink-600"><CheckCircle2 className="size-4 text-leaf-500" aria-hidden />{t("All items are well stocked.", "সব পণ্যের পর্যাপ্ত স্টক আছে।")}</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
