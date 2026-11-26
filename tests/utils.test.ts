import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { hasPermission } from "@/lib/auth/permissions";
import { discountPercent, formatMoney, toMinor } from "@/lib/utils/money";
import { slugify } from "@/lib/utils/slug";
import { parseRange } from "@/lib/utils/range";
import { registerSchema } from "@/lib/validation/schemas";

describe("password hashing", () => {
  it("verifies correct passwords and rejects wrong ones", async () => {
    const h = await hashPassword("fresh1234");
    expect(h.startsWith("pbkdf2$100000$")).toBe(true);
    expect(await verifyPassword("fresh1234", h)).toBe(true);
    expect(await verifyPassword("fresh12345", h)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
  it("salts each hash", async () => {
    expect(await hashPassword("same-pass1")).not.toBe(await hashPassword("same-pass1"));
  });
});

describe("money", () => {
  it("formats minor units", () => {
    expect(formatMoney(12000)).toBe("৳120");
    expect(formatMoney(12050, "₹")).toBe("₹120.50");
    expect(formatMoney(12345600)).toBe("৳1,23,456");
  });
  it("converts to minor units without float drift", () => {
    expect(toMinor("19.99")).toBe(1999);
    expect(toMinor(0.1 + 0.2)).toBe(30);
  });
  it("computes discount percent", () => {
    expect(discountPercent(12000, 14000)).toBe(14);
    expect(discountPercent(12000, null)).toBe(0);
    expect(discountPercent(12000, 10000)).toBe(0);
  });
});

describe("store dates", () => {
  it("uses the store time zone, not UTC", async () => {
    const { storeDate } = await import("@/lib/utils/dates");
    const now = new Date("2026-11-26T21:30:00Z"); // 03:00 next day in Asia/Kolkata
    expect(storeDate("Asia/Kolkata", 0, now)).toBe("2026-11-27");
    expect(storeDate("UTC", 0, now)).toBe("2026-11-26");
    expect(storeDate("Asia/Kolkata", 2, now)).toBe("2026-11-29");
  });
});

describe("misc", () => {
  it("slugifies", () => expect(slugify("  Mango (Himsagar) — 1kg! ")).toBe("mango-himsagar-1kg"));
  it("checks permissions", () => {
    expect(hasPermission(["*"], "roles:write")).toBe(true);
    expect(hasPermission(["orders:write"], "roles:write")).toBe(false);
    expect(hasPermission(null, "orders:write")).toBe(false);
  });
  it("validates registration input", () => {
    expect(registerSchema.safeParse({ name: "Rina", email: "RINA@x.com", password: "abcd1234" }).success).toBe(true);
    expect(registerSchema.safeParse({ name: "Rina", email: "bad", password: "abcd1234" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Rina", email: "a@b.co", password: "allletters" }).success).toBe(false);
  });
  it("clamps report ranges", () => {
    const r = parseRange({ from: "2026-01-01", to: "2026-01-31" });
    expect([r.from, r.to]).toEqual(["2026-01-01", "2026-01-31"]);
    const bad = parseRange({ from: "2020-01-01", to: "2026-01-31" });
    expect(bad.from).toBe("2026-01-02");
  });
});
