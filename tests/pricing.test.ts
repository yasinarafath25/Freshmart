import { describe, expect, it } from "vitest";
import { canTransition, computeTotals, customerCanCancel, deliveryFeeFor, evaluateCoupon, type CouponLike } from "@/lib/services/pricing";

const base: CouponLike = {
  code: "TEST",
  type: "percent",
  value: 20,
  minOrder: 0,
  maxDiscount: null,
  startsAt: null,
  endsAt: null,
  usageLimit: null,
  usedCount: 0,
  perUserLimit: 1,
  isActive: true,
};

describe("evaluateCoupon", () => {
  it("applies percentage discounts with a cap", () => {
    expect(evaluateCoupon({ ...base, maxDiscount: 5000 }, 100000, 0)).toEqual({ ok: true, discount: 5000, freeDelivery: false });
    expect(evaluateCoupon(base, 10000, 0)).toEqual({ ok: true, discount: 2000, freeDelivery: false });
  });
  it("never discounts more than the subtotal", () => {
    expect(evaluateCoupon({ ...base, type: "fixed", value: 99999 }, 5000, 0)).toMatchObject({ ok: true, discount: 5000 });
  });
  it("rejects inactive, expired, not-started, exhausted and over-used coupons", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    expect(evaluateCoupon(null, 1000, 0).ok).toBe(false);
    expect(evaluateCoupon({ ...base, isActive: false }, 1000, 0).ok).toBe(false);
    expect(evaluateCoupon({ ...base, endsAt: new Date("2026-05-01") }, 1000, 0, now)).toMatchObject({ ok: false, error: expect.stringMatching(/expired/) });
    expect(evaluateCoupon({ ...base, startsAt: new Date("2026-07-01") }, 1000, 0, now)).toMatchObject({ ok: false });
    expect(evaluateCoupon({ ...base, usageLimit: 5, usedCount: 5 }, 1000, 0)).toMatchObject({ ok: false });
    expect(evaluateCoupon(base, 1000, 1)).toMatchObject({ ok: false, error: expect.stringMatching(/already used/) });
  });
  it("allows unlimited per-user use when perUserLimit is 0", () => {
    expect(evaluateCoupon({ ...base, perUserLimit: 0 }, 1000, 7).ok).toBe(true);
  });
  it("enforces the minimum order", () => {
    expect(evaluateCoupon({ ...base, minOrder: 50000 }, 49999, 0)).toMatchObject({ ok: false, error: expect.stringMatching(/Minimum order/) });
  });
  it("free_delivery coupons give zero discount but free delivery", () => {
    expect(evaluateCoupon({ ...base, type: "free_delivery" }, 1000, 0)).toEqual({ ok: true, discount: 0, freeDelivery: true });
  });
});

describe("delivery fee & totals", () => {
  const zone = { fee: 3000, freeAbove: 99900 };
  it("charges the zone fee below the threshold and nothing at/above it", () => {
    expect(deliveryFeeFor(zone, 99899, 50000)).toBe(3000);
    expect(deliveryFeeFor(zone, 99900, 50000)).toBe(0);
    expect(deliveryFeeFor({ fee: 3000, freeAbove: null }, 50000, 50000)).toBe(0);
    expect(deliveryFeeFor(zone, 100, 0, true)).toBe(0);
  });
  it("computes totals from server prices", () => {
    const t = computeTotals({ lines: [{ unitPrice: 12000, quantity: 2 }, { unitPrice: 4000, quantity: 1 }], zone, defaultFreeThreshold: 99900, coupon: { ok: true, discount: 2000, freeDelivery: false } });
    expect(t).toMatchObject({ subtotal: 28000, discount: 2000, deliveryFee: 3000, total: 29000, amountToFreeDelivery: 99900 - 26000 });
  });
  it("discount applies before the free-delivery check", () => {
    const t = computeTotals({ lines: [{ unitPrice: 100000, quantity: 1 }], zone, defaultFreeThreshold: 99900, coupon: { ok: true, discount: 20000, freeDelivery: false } });
    expect(t.deliveryFee).toBe(3000);
  });
  it("empty cart has no delivery fee", () => {
    expect(computeTotals({ lines: [], zone, defaultFreeThreshold: 0 }).total).toBe(0);
  });
});

describe("order status rules", () => {
  it("only moves forward and allows cancel before delivery", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
    expect(canTransition("pending", "delivered")).toBe(true);
    expect(canTransition("processing", "confirmed")).toBe(false);
    expect(canTransition("out_for_delivery", "cancelled")).toBe(true);
    expect(canTransition("delivered", "cancelled")).toBe(false);
    expect(canTransition("cancelled", "confirmed")).toBe(false);
  });
  it("customers may cancel only pending/confirmed orders", () => {
    expect(customerCanCancel("pending")).toBe(true);
    expect(customerCanCancel("confirmed")).toBe(true);
    expect(customerCanCancel("processing")).toBe(false);
  });
});
