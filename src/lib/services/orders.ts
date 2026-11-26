import "server-only";
import { and, asc, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { getDb, type DB } from "@/lib/db/client";
import {
  cartItems,
  couponRedemptions,
  coupons,
  deliveryZones,
  inventoryMovements,
  notifications,
  orderItems,
  orderStatusHistory,
  orders,
  payments,
  productVariants,
  products,
  type OrderStatus,
} from "@/lib/db/schema";
import { loadCartLines } from "./cart";
import { canTransition, computeTotals, customerCanCancel, evaluateCoupon, type FlowStatus } from "./pricing";
import { getSettings } from "./settings";
import { formatMoney } from "@/lib/utils/money";
import { storeDate } from "@/lib/utils/dates";

export class CheckoutError extends Error {}

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

const STATUS_TEXT: Record<OrderStatus, string> = {
  pending: "Order placed",
  confirmed: "Order confirmed",
  processing: "Being packed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
export const statusLabel = (s: OrderStatus) => STATUS_TEXT[s];

function orderNumber(timeZone: string): string {
  const ymd = storeDate(timeZone).slice(2).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rnd = crypto.getRandomValues(new Uint8Array(5));
  return `FM-${ymd}-${Array.from(rnd, (b) => alphabet[b % alphabet.length]).join("")}`;
}

async function notify(tx: Tx | DB, userId: string, title: string, body: string, link: string) {
  await tx.insert(notifications).values({ userId, title, body, link });
}

export type PlaceOrderInput = {
  userId: string;
  cartId: string;
  checkoutToken: string;
  address: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string | null;
    area: string;
    city: string;
    postalCode?: string | null;
  };
  zoneId: string;
  deliveryDate: string;
  deliverySlot: string;
  couponCode?: string | null;
  paymentMethod: "cod" | "sslcommerz";
  notes?: string | null;
};

/** Quote totals for the checkout summary (no writes). */
export async function quoteCheckout(userId: string, cartId: string, zoneId: string | null, couponCode: string | null) {
  const db = getDb();
  const settings = await getSettings();
  const lines = (await loadCartLines(db, cartId)).filter((l) => l.available);
  const zone = zoneId ? await db.query.deliveryZones.findFirst({ where: and(eq(deliveryZones.id, zoneId), eq(deliveryZones.isActive, true)) }) : null;
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  let couponResult = null;
  if (couponCode) {
    const c = await db.query.coupons.findFirst({ where: eq(coupons.code, couponCode.toUpperCase()) });
    const uses = c ? await countUserRedemptions(db, c.id, userId) : 0;
    couponResult = evaluateCoupon(c, subtotal, uses, new Date(), (n) => formatMoney(n, settings.currencySymbol));
  }
  const totals = computeTotals({ lines, zone, defaultFreeThreshold: settings.freeDeliveryThreshold, coupon: couponResult });
  return { lines, zone, totals, coupon: couponResult };
}

async function countUserRedemptions(db: Tx | DB, couponId: string, userId: string) {
  const r = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(couponRedemptions)
    .where(and(eq(couponRedemptions.couponId, couponId), eq(couponRedemptions.userId, userId)));
  return r[0]?.n ?? 0;
}

export async function placeOrder(input: PlaceOrderInput) {
  const db = getDb();
  const settings = await getSettings();
  const fmt = (n: number) => formatMoney(n, settings.currencySymbol);

  return db.transaction(async (tx) => {
    // Idempotency: the same checkout form submitted twice returns the first order.
    const dup = await tx.query.orders.findFirst({ where: eq(orders.checkoutToken, input.checkoutToken) });
    if (dup) {
      if (dup.userId !== input.userId) throw new CheckoutError("Invalid checkout session. Please reload the page.");
      return dup;
    }

    const lines = await loadCartLines(tx as unknown as DB, input.cartId);
    if (lines.length === 0) throw new CheckoutError("Your cart is empty.");
    const bad = lines.find((l) => !l.available);
    if (bad) throw new CheckoutError(`${bad.productName} (${bad.variantName}): ${bad.issue}. Please update your cart.`);

    const zone = await tx.query.deliveryZones.findFirst({
      where: and(eq(deliveryZones.id, input.zoneId), eq(deliveryZones.isActive, true)),
    });
    if (!zone) throw new CheckoutError("Please choose a valid delivery area.");

    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

    let coupon = null as (typeof coupons.$inferSelect) | null;
    let couponResult = null;
    if (input.couponCode) {
      const rows = await tx
        .select()
        .from(coupons)
        .where(eq(coupons.code, input.couponCode.toUpperCase()))
        .for("update");
      coupon = rows[0] ?? null;
      const uses = coupon ? await countUserRedemptions(tx, coupon.id, input.userId) : 0;
      couponResult = evaluateCoupon(coupon, subtotal, uses, new Date(), fmt);
      if (!couponResult.ok) throw new CheckoutError(couponResult.error);
    }

    const totals = computeTotals({ lines, zone, defaultFreeThreshold: settings.freeDeliveryThreshold, coupon: couponResult });
    if (totals.subtotal - totals.discount < settings.minOrder)
      throw new CheckoutError(`Minimum order value is ${fmt(settings.minOrder)}.`);

    // Atomic stock decrement — fails if any variant lacks stock.
    for (const l of lines) {
      const updated = await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} - ${l.quantity}` })
        .where(and(eq(productVariants.id, l.variantId), sql`${productVariants.stock} >= ${l.quantity}`))
        .returning({ id: productVariants.id });
      if (updated.length === 0) throw new CheckoutError(`Sorry, ${l.productName} just ran out of stock.`);
    }

    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: orderNumber(settings.timeZone),
        checkoutToken: input.checkoutToken,
        userId: input.userId,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentMethod === "cod" ? "unpaid" : "pending",
        subtotal: totals.subtotal,
        discount: totals.discount,
        deliveryFee: totals.deliveryFee,
        total: totals.total,
        couponCode: coupon?.code ?? null,
        shipName: input.address.fullName,
        shipPhone: input.address.phone,
        shipLine1: input.address.line1,
        shipLine2: input.address.line2 ?? null,
        shipArea: input.address.area,
        shipCity: input.address.city,
        shipPostalCode: input.address.postalCode ?? null,
        zoneId: zone.id,
        zoneName: zone.name,
        deliveryDate: input.deliveryDate,
        deliverySlot: input.deliverySlot,
        notes: input.notes ?? null,
      })
      .returning();

    await tx.insert(orderItems).values(
      lines.map((l) => ({
        orderId: order.id,
        productId: l.productId,
        variantId: l.variantId,
        productName: l.productName,
        productNameBn: l.productNameBn,
        variantName: l.variantName,
        unit: l.unit,
        image: l.image,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        lineTotal: l.lineTotal,
      })),
    );
    await tx.insert(inventoryMovements).values(
      lines.map((l) => ({ variantId: l.variantId, change: -l.quantity, reason: "order" as const, reference: order.orderNumber, actorId: input.userId })),
    );
    for (const l of lines) {
      await tx
        .update(products)
        .set({ soldCount: sql`${products.soldCount} + ${l.quantity}` })
        .where(eq(products.id, l.productId));
    }
    await tx.insert(orderStatusHistory).values({ orderId: order.id, status: "pending", note: "Order placed by customer", actorId: input.userId });

    if (coupon) {
      await tx.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, coupon.id));
      await tx.insert(couponRedemptions).values({ couponId: coupon.id, userId: input.userId, orderId: order.id });
    }

    await tx.delete(cartItems).where(eq(cartItems.cartId, input.cartId));
    await notify(tx, input.userId, `Order ${order.orderNumber} placed`, `Thanks! Your order total is ${fmt(order.total)}.`, `/account/orders/${order.id}`);
    return order;
  });
}

export async function getOrderForUser(orderId: string, userId: string) {
  const db = getDb();
  const order = await db.query.orders.findFirst({ where: and(eq(orders.id, orderId), eq(orders.userId, userId)) });
  if (!order) return null;
  return loadOrderDetail(order);
}

export async function getOrderByNumberForUser(orderNumber: string, userId: string) {
  const db = getDb();
  const order = await db.query.orders.findFirst({ where: and(eq(orders.orderNumber, orderNumber), eq(orders.userId, userId)) });
  if (!order) return null;
  return loadOrderDetail(order);
}

export async function loadOrderDetail(order: typeof orders.$inferSelect) {
  const db = getDb();
  const [items, history, pays] = await Promise.all([
    // Older orders have no Bangla snapshot; fall back to the product's current Bangla name.
    db
      .select({ ...getTableColumns(orderItems), productNameBn: sql<string | null>`coalesce(${orderItems.productNameBn}, ${products.nameBn})` })
      .from(orderItems)
      .leftJoin(products, eq(products.id, orderItems.productId))
      .where(eq(orderItems.orderId, order.id)),
    db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, order.id)).orderBy(asc(orderStatusHistory.createdAt)),
    db.select().from(payments).where(eq(payments.orderId, order.id)).orderBy(desc(payments.createdAt)),
  ]);
  return { ...order, items, history, payments: pays };
}

export async function listUserOrders(userId: string, page = 1, perPage = 10) {
  const db = getDb();
  const [rows, count] = await Promise.all([
    db
      .select({
        o: orders,
        itemCount: sql<number>`(select coalesce(sum(quantity),0)::int from order_items oi where oi.order_id = ${orders.id})`,
      })
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.userId, userId)),
  ]);
  const total = count[0]?.n ?? 0;
  return { items: rows.map((r) => ({ ...r.o, itemCount: r.itemCount })), total, pages: Math.max(Math.ceil(total / perPage), 1) };
}

/** Cancel an order: restock items, release coupon usage, record history. */
export async function cancelOrder(opts: { orderId: string; actorId: string; reason: string; asCustomer: boolean }) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(orders).where(eq(orders.id, opts.orderId)).for("update");
    const order = rows[0];
    if (!order) throw new CheckoutError("Order not found.");
    if (opts.asCustomer) {
      if (order.userId !== opts.actorId) throw new CheckoutError("Order not found.");
      if (!customerCanCancel(order.status)) throw new CheckoutError("This order can no longer be cancelled. Please contact support.");
    } else if (!canTransition(order.status, "cancelled")) {
      throw new CheckoutError("This order cannot be cancelled.");
    }
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    for (const it of items) {
      if (!it.variantId) continue;
      await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} + ${it.quantity}` })
        .where(eq(productVariants.id, it.variantId));
      await tx.insert(inventoryMovements).values({ variantId: it.variantId, change: it.quantity, reason: "cancel", reference: order.orderNumber, actorId: opts.actorId });
      if (it.productId)
        await tx
          .update(products)
          .set({ soldCount: sql`greatest(${products.soldCount} - ${it.quantity}, 0)` })
          .where(eq(products.id, it.productId));
    }
    const redemption = await tx.query.couponRedemptions.findFirst({ where: eq(couponRedemptions.orderId, order.id) });
    if (redemption) {
      await tx.update(coupons).set({ usedCount: sql`greatest(${coupons.usedCount} - 1, 0)` }).where(eq(coupons.id, redemption.couponId));
      await tx.delete(couponRedemptions).where(eq(couponRedemptions.id, redemption.id));
    }
    const nextPayment = order.paymentStatus === "paid" ? "paid" : order.paymentStatus === "pending" ? "failed" : order.paymentStatus;
    await tx
      .update(orders)
      .set({ status: "cancelled", cancelReason: opts.reason, paymentStatus: nextPayment })
      .where(eq(orders.id, order.id));
    await tx.insert(orderStatusHistory).values({
      orderId: order.id,
      status: "cancelled",
      note: `${opts.asCustomer ? "Cancelled by customer" : "Cancelled by store"}${opts.reason ? `: ${opts.reason}` : ""}`,
      actorId: opts.actorId,
    });
    await notify(
      tx,
      order.userId,
      `Order ${order.orderNumber} cancelled`,
      order.paymentStatus === "paid"
        ? "Your order was cancelled. Our team will contact you about your refund."
        : "Your order was cancelled.",
      `/account/orders/${order.id}`,
    );
    return order;
  });
}

/** Staff status update (forward-only workflow). */
export async function updateOrderStatus(opts: { orderId: string; to: FlowStatus; note: string | null; actorId: string }) {
  if (opts.to === "cancelled") return cancelOrder({ orderId: opts.orderId, actorId: opts.actorId, reason: opts.note ?? "", asCustomer: false });
  const db = getDb();
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(orders).where(eq(orders.id, opts.orderId)).for("update");
    const order = rows[0];
    if (!order) throw new CheckoutError("Order not found.");
    if (!canTransition(order.status, opts.to)) throw new CheckoutError(`Cannot move an order from ${order.status} to ${opts.to}.`);
    await tx.update(orders).set({ status: opts.to as OrderStatus }).where(eq(orders.id, order.id));
    await tx.insert(orderStatusHistory).values({ orderId: order.id, status: opts.to as OrderStatus, note: opts.note, actorId: opts.actorId });
    await notify(tx, order.userId, `Order ${order.orderNumber}: ${STATUS_TEXT[opts.to as OrderStatus]}`, opts.note || `Your order is now "${STATUS_TEXT[opts.to as OrderStatus]}".`, `/account/orders/${order.id}`);
    return order;
  });
}

/** Staff confirms cash was collected for a COD order. */
export async function markCodPaid(orderId: string, actorId: string) {
  const db = getDb();
  const settings = await getSettings();
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    const order = rows[0];
    if (!order) throw new CheckoutError("Order not found.");
    if (order.paymentMethod !== "cod") throw new CheckoutError("Only cash-on-delivery orders can be marked paid manually.");
    if (order.paymentStatus === "paid") throw new CheckoutError("Order is already paid.");
    if (order.status === "cancelled") throw new CheckoutError("Order is cancelled.");
    await tx.update(orders).set({ paymentStatus: "paid" }).where(eq(orders.id, order.id));
    await tx.insert(payments).values({
      orderId: order.id,
      provider: "cod",
      amount: order.total,
      currency: settings.currencyCode,
      status: "success",
      transactionId: `COD-${order.orderNumber}`,
      raw: { collectedBy: actorId },
    });
    await tx.insert(orderStatusHistory).values({ orderId: order.id, status: order.status, note: "Cash payment collected", actorId });
  });
}
