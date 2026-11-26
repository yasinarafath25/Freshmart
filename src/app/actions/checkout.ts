"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { addresses } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { resolveCartId } from "@/lib/services/cart";
import { CheckoutError, placeOrder, quoteCheckout } from "@/lib/services/orders";
import { enabledPaymentMethods } from "@/lib/services/payments";
import { getSettings } from "@/lib/services/settings";
import { addressSchema, fieldErrors } from "@/lib/validation/schemas";
import { clientIp, rateLimit } from "@/lib/utils/rate-limit";
import { storeDate } from "@/lib/utils/dates";

export type QuoteResult = {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponError?: string;
  couponApplied?: string;
};

export async function previewCheckoutAction(zoneId: string | null, couponCode: string | null): Promise<QuoteResult | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const cartId = await resolveCartId(false);
  if (!cartId) return null;
  const zid = zoneId && z.string().uuid().safeParse(zoneId).success ? zoneId : null;
  const code = couponCode?.trim().toUpperCase().slice(0, 30) || null;
  const q = await quoteCheckout(user.id, cartId, zid, code);
  return {
    ...q.totals,
    couponError: q.coupon && !q.coupon.ok ? q.coupon.error : undefined,
    couponApplied: q.coupon?.ok ? code! : undefined,
  };
}

export type CheckoutState = { message?: string; errors?: Record<string, string> } | null;

const checkoutSchema = z.object({
  checkoutToken: z.string().uuid(),
  addressId: z.string(),
  zoneId: z.string().uuid("Please choose a delivery area."),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a delivery date."),
  deliverySlot: z.string().min(1, "Please choose a delivery time slot.").max(40),
  couponCode: z.string().trim().max(30).optional(),
  paymentMethod: z.enum(["cod", "sslcommerz"], { message: "Please choose a payment method." }),
  notes: z.string().trim().max(300).optional(),
});

export async function placeOrderAction(_: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please check the highlighted fields." };
  const d = parsed.data;

  if (!(await rateLimit(`checkout:${user.id}:${await clientIp()}`, 10, 600))) return { message: "Too many attempts. Please wait a few minutes." };

  const settings = await getSettings();
  if (!enabledPaymentMethods(settings.codEnabled).some((m) => m.id === d.paymentMethod)) return { errors: { paymentMethod: "This payment method is not available." } };

  // Delivery date must be within the next 3 days (today included).
  const allowed = Array.from({ length: 3 }, (_, i) => storeDate(settings.timeZone, i));
  if (!allowed.includes(d.deliveryDate)) return { errors: { deliveryDate: "Please choose a date in the next 3 days." } };
  if (!settings.deliverySlots.includes(d.deliverySlot)) return { errors: { deliverySlot: "Please choose a valid time slot." } };

  const db = getDb();
  let address;
  if (d.addressId === "new") {
    const a = addressSchema.safeParse({ ...raw, zoneId: d.zoneId });
    if (!a.success) return { errors: fieldErrors(a.error), message: "Please complete your delivery address." };
    address = a.data;
    if (raw.saveAddress === "on") {
      const count = await db.$count(addresses, eq(addresses.userId, user.id));
      if (count < 10) await db.insert(addresses).values({ ...a.data, line2: a.data.line2 || null, postalCode: a.data.postalCode || null, userId: user.id, isDefault: count === 0 });
    }
  } else {
    if (!z.string().uuid().safeParse(d.addressId).success) return { errors: { addressId: "Please choose an address." } };
    const saved = await db.query.addresses.findFirst({ where: and(eq(addresses.id, d.addressId), eq(addresses.userId, user.id)) });
    if (!saved) return { errors: { addressId: "Please choose an address." } };
    address = saved;
  }

  const cartId = await resolveCartId(false);
  if (!cartId) return { message: "Your cart is empty." };

  let order;
  try {
    order = await placeOrder({
      userId: user.id,
      cartId,
      checkoutToken: d.checkoutToken,
      address: { fullName: address.fullName, phone: address.phone, line1: address.line1, line2: address.line2 || null, area: address.area, city: address.city, postalCode: address.postalCode || null },
      zoneId: d.zoneId,
      deliveryDate: d.deliveryDate,
      deliverySlot: d.deliverySlot,
      couponCode: d.couponCode || null,
      paymentMethod: d.paymentMethod,
      notes: d.notes || null,
    });
  } catch (e) {
    if (e instanceof CheckoutError) return { message: e.message };
    console.error("[checkout] placeOrder failed", e);
    return { message: "Something went wrong while placing your order. You have not been charged. Please try again." };
  }
  redirect(order.paymentMethod === "sslcommerz" ? `/checkout/pay/${order.orderNumber}` : `/checkout/success/${order.orderNumber}`);
}
