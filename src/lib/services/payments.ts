import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { orderStatusHistory, orders, payments, users, type Order } from "@/lib/db/schema";
import { getSettings } from "./settings";

/**
 * SSLCommerz (v4) integration, implemented from the public API documentation.
 * Disabled unless SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD are set.
 * NOT yet verified against a live sandbox — test with sandbox credentials before enabling in production.
 * An order is only marked paid after a server-to-server call to the validation API confirms
 * status VALID/VALIDATED and the amount + currency match the order.
 */
function cfg() {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePass = process.env.SSLCOMMERZ_STORE_PASSWORD;
  if (!storeId || !storePass) return null;
  const sandbox = process.env.SSLCOMMERZ_SANDBOX !== "false";
  return { storeId, storePass, base: sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com" };
}

export function enabledPaymentMethods(codEnabled: boolean) {
  const list: { id: "cod" | "sslcommerz"; label: string; description: string }[] = [];
  if (codEnabled) list.push({ id: "cod", label: "Cash on Delivery", description: "Pay with cash when your order arrives." });
  if (cfg()) list.push({ id: "sslcommerz", label: "Pay online", description: "Cards, mobile banking (bKash, Nagad) and net banking via SSLCommerz." });
  return list;
}

export function isSslcommerzEnabled() {
  return cfg() !== null;
}

const major = (minor: number) => (minor / 100).toFixed(2);

export async function initiateSslcommerz(order: Order): Promise<{ url: string } | { error: string }> {
  const c = cfg();
  if (!c) return { error: "Online payment is not configured." };
  const db = getDb();
  const settings = await getSettings();
  const user = await db.query.users.findFirst({ where: eq(users.id, order.userId) });
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const tranId = `${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`;

  const body = new URLSearchParams({
    store_id: c.storeId,
    store_passwd: c.storePass,
    total_amount: major(order.total),
    currency: settings.currencyCode,
    tran_id: tranId,
    success_url: `${appUrl}/api/payments/sslcommerz/success`,
    fail_url: `${appUrl}/api/payments/sslcommerz/fail`,
    cancel_url: `${appUrl}/api/payments/sslcommerz/cancel`,
    ipn_url: `${appUrl}/api/payments/sslcommerz/ipn`,
    cus_name: order.shipName,
    cus_email: user?.email ?? "customer@example.com",
    cus_add1: order.shipLine1,
    cus_city: order.shipCity,
    cus_postcode: order.shipPostalCode ?? "0000",
    cus_country: "Bangladesh",
    cus_phone: order.shipPhone,
    shipping_method: "YES",
    num_of_item: "1",
    ship_name: order.shipName,
    ship_add1: order.shipLine1,
    ship_city: order.shipCity,
    ship_postcode: order.shipPostalCode ?? "0000",
    ship_country: "Bangladesh",
    product_name: `Order ${order.orderNumber}`,
    product_category: "Groceries",
    product_profile: "general",
    value_a: order.id,
  });

  let json: { status?: string; GatewayPageURL?: string; failedreason?: string };
  try {
    const res = await fetch(`${c.base}/gwprocess/v4/api.php`, { method: "POST", body });
    json = await res.json();
  } catch (e) {
    console.error("[sslcommerz] init failed", e);
    return { error: "Could not reach the payment gateway. Please try again." };
  }
  if (json.status !== "SUCCESS" || !json.GatewayPageURL) {
    console.error("[sslcommerz] init rejected", json.failedreason);
    return { error: "The payment gateway rejected the request. Please try again or choose cash on delivery." };
  }
  await db.insert(payments).values({ orderId: order.id, provider: "sslcommerz", amount: order.total, currency: settings.currencyCode, status: "initiated", transactionId: tranId });
  return { url: json.GatewayPageURL };
}

/** Server-to-server validation. Returns the order on success. */
export async function validateSslcommerz(valId: string): Promise<{ ok: true; order: Order } | { ok: false; reason: string; orderId?: string }> {
  const c = cfg();
  if (!c) return { ok: false, reason: "not-configured" };
  const url = `${c.base}/validator/api/validationserverAPI.php?${new URLSearchParams({ val_id: valId, store_id: c.storeId, store_passwd: c.storePass, format: "json" })}`;
  let v: { status?: string; tran_id?: string; amount?: string; currency?: string; bank_tran_id?: string };
  try {
    v = await (await fetch(url)).json();
  } catch {
    return { ok: false, reason: "validation-unreachable" };
  }
  if (!v.tran_id || (v.status !== "VALID" && v.status !== "VALIDATED")) return { ok: false, reason: `status-${v.status}` };

  const db = getDb();
  return db.transaction(async (tx) => {
    const pay = (await tx.select().from(payments).where(eq(payments.transactionId, v.tran_id!)).for("update"))[0];
    if (!pay) return { ok: false as const, reason: "unknown-transaction" };
    const order = (await tx.select().from(orders).where(eq(orders.id, pay.orderId)).for("update"))[0];
    if (!order) return { ok: false as const, reason: "unknown-order" };
    const amountOk = Math.round(Number(v.amount) * 100) === pay.amount && pay.amount === order.total;
    const currencyOk = v.currency === pay.currency;
    if (!amountOk || !currencyOk) {
      await tx.update(payments).set({ status: "failed", validationId: valId, raw: v }).where(eq(payments.id, pay.id));
      return { ok: false as const, reason: "amount-mismatch", orderId: order.id };
    }
    if (pay.status !== "success") {
      await tx.update(payments).set({ status: "success", validationId: valId, raw: v }).where(eq(payments.id, pay.id));
      if (order.paymentStatus !== "paid") {
        await tx.update(orders).set({ paymentStatus: "paid" }).where(eq(orders.id, order.id));
        await tx.insert(orderStatusHistory).values({ orderId: order.id, status: order.status, note: `Online payment received (${v.bank_tran_id ?? v.tran_id})` });
      }
    }
    return { ok: true as const, order: { ...order, paymentStatus: "paid" as const } };
  });
}

/** Gateway reported failure/cancel. We only mark our own initiated record; never marks anything paid. */
export async function markSslcommerzAttempt(tranId: string, status: "failed" | "cancelled") {
  const db = getDb();
  const pay = await db.query.payments.findFirst({ where: and(eq(payments.transactionId, tranId), eq(payments.status, "initiated")) });
  if (!pay) return null;
  await db.update(payments).set({ status }).where(eq(payments.id, pay.id));
  await db.update(orders).set({ paymentStatus: "failed" }).where(and(eq(orders.id, pay.orderId), eq(orders.paymentStatus, "pending")));
  return pay.orderId;
}
