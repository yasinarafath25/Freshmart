"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { addToCart, clearCart, setCartQuantity, ZONE_COOKIE, MAX_LINE_QTY } from "@/lib/services/cart";
import { getDb } from "@/lib/db/client";
import { deliveryZones } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const uuid = z.string().uuid();
const qty = z.coerce.number().int().min(0).max(MAX_LINE_QTY);

export type CartActionResult = { ok: boolean; message?: string };

export async function addToCartAction(variantId: string, quantity = 1): Promise<CartActionResult> {
  const v = uuid.safeParse(variantId);
  const q = qty.safeParse(quantity);
  if (!v.success || !q.success || q.data < 1) return { ok: false, message: "Invalid item." };
  const res = await addToCart(v.data, q.data);
  if (!res.ok) return { ok: false, message: res.error };
  revalidatePath("/", "layout");
  return { ok: true, message: res.capped ? `Only ${res.quantity} available — cart updated.` : "Added to cart" };
}

export async function updateCartItemAction(formData: FormData) {
  const v = uuid.safeParse(formData.get("variantId"));
  const q = qty.safeParse(formData.get("quantity"));
  if (!v.success || !q.success) return;
  await setCartQuantity(v.data, q.data);
  revalidatePath("/", "layout");
}

export async function removeCartItemAction(formData: FormData) {
  const v = uuid.safeParse(formData.get("variantId"));
  if (!v.success) return;
  await setCartQuantity(v.data, 0);
  revalidatePath("/", "layout");
}

export async function clearCartAction() {
  await clearCart();
  revalidatePath("/", "layout");
}

export async function setZoneAction(zoneId: string) {
  const v = uuid.safeParse(zoneId);
  if (!v.success) return;
  const zone = await getDb().query.deliveryZones.findFirst({ where: and(eq(deliveryZones.id, v.data), eq(deliveryZones.isActive, true)) });
  if (!zone) return;
  (await cookies()).set(ZONE_COOKIE, zone.id, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365, httpOnly: true });
  revalidatePath("/", "layout");
}
