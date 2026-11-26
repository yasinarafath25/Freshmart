import "server-only";
import { and, desc, eq, gte, lte, ne, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { categories, couponRedemptions, coupons, orderItems, orders, productVariants, products, users } from "@/lib/db/schema";

/** Revenue = non-cancelled orders' totals. "Collected" = paid orders. */
const notCancelled = ne(orders.status, "cancelled");

/** Inclusive YYYY-MM-DD day range in the store time zone. */
export type DayRange = { from: string; to: string; tz: string };
const localDay = (tz: string) => sql`(${orders.createdAt} at time zone ${tz})::date`;
const inRange = (r: DayRange): SQL => sql`${localDay(r.tz)} between ${r.from}::date and ${r.to}::date`;

export async function overview(lowStockThreshold: number, tz: string) {
  const db = getDb();
  const since30 = new Date(Date.now() - 30 * 86400000);
  const [rev30, today, customers, pending, lowStock, collected] = await Promise.all([
    db.select({ sum: sql<number>`coalesce(sum(${orders.total}),0)::int`, n: sql<number>`count(*)::int` }).from(orders).where(and(notCancelled, gte(orders.createdAt, since30))),
    db.select({ sum: sql<number>`coalesce(sum(${orders.total}),0)::int`, n: sql<number>`count(*)::int` }).from(orders).where(and(notCancelled, sql`${localDay(tz)} = (now() at time zone ${tz})::date`)),
    db.$count(users, eq(users.role, "customer")),
    db.$count(orders, eq(orders.status, "pending")),
    db.$count(productVariants, lte(productVariants.stock, lowStockThreshold)),
    db.select({ sum: sql<number>`coalesce(sum(${orders.total}),0)::int` }).from(orders).where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, since30))),
  ]);
  const n30 = rev30[0]?.n ?? 0;
  return {
    revenue30: rev30[0]?.sum ?? 0,
    orders30: n30,
    aov30: n30 ? Math.round((rev30[0]?.sum ?? 0) / n30) : 0,
    revenueToday: today[0]?.sum ?? 0,
    ordersToday: today[0]?.n ?? 0,
    collected30: collected[0]?.sum ?? 0,
    customers,
    pending,
    lowStock,
  };
}

export async function salesByDay(r: DayRange) {
  const db = getDb();
  const rows = await db
    .select({
      day: sql<string>`to_char(${localDay(r.tz)}, 'YYYY-MM-DD')`,
      revenue: sql<number>`coalesce(sum(${orders.total}),0)::int`,
      orders: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(and(notCancelled, inRange(r)))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  const map = new Map(rows.map((x) => [x.day, x]));
  const out: { day: string; revenue: number; orders: number }[] = [];
  for (let d = new Date(r.from + "T00:00:00Z"); d.toISOString().slice(0, 10) <= r.to; d = new Date(d.getTime() + 86400000)) {
    const key = d.toISOString().slice(0, 10);
    out.push({ day: key, revenue: map.get(key)?.revenue ?? 0, orders: map.get(key)?.orders ?? 0 });
  }
  return out;
}

export async function salesByCategory(r: DayRange) {
  return getDb()
    .select({
      category: sql<string>`coalesce(${categories.name}, 'Uncategorised')`,
      revenue: sql<number>`sum(${orderItems.lineTotal})::int`,
      units: sql<number>`sum(${orderItems.quantity})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .leftJoin(products, eq(products.id, orderItems.productId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(and(notCancelled, inRange(r)))
    .groupBy(sql`1`)
    .orderBy(desc(sql`2`));
}

export async function topProducts(r: DayRange, limit = 10) {
  return getDb()
    .select({
      name: orderItems.productName,
      revenue: sql<number>`sum(${orderItems.lineTotal})::int`,
      units: sql<number>`sum(${orderItems.quantity})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(notCancelled, inRange(r)))
    .groupBy(orderItems.productName)
    .orderBy(desc(sql`2`))
    .limit(limit);
}

export async function couponUsage(r: DayRange) {
  return getDb()
    .select({ code: coupons.code, uses: sql<number>`count(*)::int`, discount: sql<number>`coalesce(sum(${orders.discount}),0)::int` })
    .from(couponRedemptions)
    .innerJoin(coupons, eq(coupons.id, couponRedemptions.couponId))
    .innerJoin(orders, eq(orders.id, couponRedemptions.orderId))
    .where(inRange(r))
    .groupBy(coupons.code)
    .orderBy(desc(sql`2`));
}

export async function lowStockList(threshold: number, limit = 8) {
  return getDb()
    .select({ id: productVariants.id, productId: products.id, product: products.name, variant: productVariants.name, stock: productVariants.stock })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(lte(productVariants.stock, threshold))
    .orderBy(productVariants.stock)
    .limit(limit);
}
