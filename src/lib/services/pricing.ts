/**
 * Single source of truth for order money maths. Pure functions — no DB access — so they
 * are shared by cart, checkout preview and order placement, and are unit-tested.
 * All amounts are integer minor units.
 */

export type CouponLike = {
  code: string;
  type: "percent" | "fixed" | "free_delivery";
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  isActive: boolean;
};

export type ZoneLike = { fee: number; freeAbove: number | null };

export type CouponResult =
  | { ok: true; discount: number; freeDelivery: boolean }
  | { ok: false; error: string };

export function evaluateCoupon(
  coupon: CouponLike | null | undefined,
  subtotal: number,
  userUses: number,
  now: Date = new Date(),
  formatMoney: (n: number) => string = (n) => String(n / 100),
): CouponResult {
  if (!coupon || !coupon.isActive) return { ok: false, error: "This coupon code is not valid." };
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, error: "This coupon is not active yet." };
  if (coupon.endsAt && coupon.endsAt < now) return { ok: false, error: "This coupon has expired." };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
    return { ok: false, error: "This coupon has reached its usage limit." };
  if (coupon.perUserLimit > 0 && userUses >= coupon.perUserLimit)
    return { ok: false, error: "You have already used this coupon." };
  if (subtotal < coupon.minOrder)
    return { ok: false, error: `Minimum order of ${formatMoney(coupon.minOrder)} required for this coupon.` };

  let discount = 0;
  if (coupon.type === "percent") {
    const pct = Math.min(Math.max(coupon.value, 0), 100);
    discount = Math.floor((subtotal * pct) / 100);
    if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === "fixed") {
    discount = Math.max(coupon.value, 0);
  }
  discount = Math.min(discount, subtotal);
  return { ok: true, discount, freeDelivery: coupon.type === "free_delivery" };
}

export function deliveryFeeFor(
  zone: ZoneLike | null | undefined,
  amountAfterDiscount: number,
  defaultFreeThreshold: number,
  freeDeliveryCoupon = false,
): number {
  if (!zone) return 0;
  if (freeDeliveryCoupon) return 0;
  const threshold = zone.freeAbove ?? defaultFreeThreshold;
  if (threshold > 0 && amountAfterDiscount >= threshold) return 0;
  return zone.fee;
}

export type Totals = {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  freeDeliveryThreshold: number;
  amountToFreeDelivery: number;
};

export function computeTotals(opts: {
  lines: { unitPrice: number; quantity: number }[];
  zone: ZoneLike | null | undefined;
  defaultFreeThreshold: number;
  coupon?: CouponResult | null;
}): Totals {
  const subtotal = opts.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const discount = opts.coupon?.ok ? Math.min(opts.coupon.discount, subtotal) : 0;
  const after = subtotal - discount;
  const freeDelivery = opts.coupon?.ok ? opts.coupon.freeDelivery : false;
  const deliveryFee = subtotal === 0 ? 0 : deliveryFeeFor(opts.zone, after, opts.defaultFreeThreshold, freeDelivery);
  const threshold = opts.zone?.freeAbove ?? opts.defaultFreeThreshold;
  return {
    subtotal,
    discount,
    deliveryFee,
    total: after + deliveryFee,
    freeDeliveryThreshold: threshold,
    amountToFreeDelivery: Math.max(threshold - after, 0),
  };
}

export const ORDER_FLOW = ["pending", "confirmed", "processing", "out_for_delivery", "delivered"] as const;
export type FlowStatus = (typeof ORDER_FLOW)[number] | "cancelled";

/** Allowed status transitions (staff). Moving forward only; cancel allowed before delivery. */
export function canTransition(from: FlowStatus, to: FlowStatus): boolean {
  if (from === to) return false;
  if (from === "delivered" || from === "cancelled") return false;
  if (to === "cancelled") return true;
  const a = ORDER_FLOW.indexOf(from as (typeof ORDER_FLOW)[number]);
  const b = ORDER_FLOW.indexOf(to as (typeof ORDER_FLOW)[number]);
  return b > a;
}

export function customerCanCancel(status: FlowStatus): boolean {
  return status === "pending" || status === "confirmed";
}
