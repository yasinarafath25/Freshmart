import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { and, asc, eq, sql } from "drizzle-orm";
import { getDb, type DB } from "@/lib/db/client";
import { cartItems, carts, categories, deliveryZones, productVariants, products } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export const CART_COOKIE = "fm_cart";
export const ZONE_COOKIE = "fm_zone";
export const MAX_LINE_QTY = 50;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function guestCartId(): Promise<string | null> {
  const v = (await cookies()).get(CART_COOKIE)?.value;
  return v && UUID_RE.test(v) ? v : null;
}

/** Resolve the cart for the current visitor. With `create`, makes one if missing. */
export async function resolveCartId(create: boolean): Promise<string | null> {
  const db = getDb();
  const user = await getCurrentUser();
  if (user) {
    const existing = await db.query.carts.findFirst({ where: eq(carts.userId, user.id) });
    if (existing) return existing.id;
    if (!create) return null;
    const [c] = await db.insert(carts).values({ userId: user.id }).returning({ id: carts.id });
    return c.id;
  }
  const id = await guestCartId();
  if (id) {
    const exists = await db.query.carts.findFirst({ where: and(eq(carts.id, id), sql`${carts.userId} is null`) });
    if (exists) return id;
  }
  if (!create) return null;
  const [c] = await db.insert(carts).values({}).returning({ id: carts.id });
  (await cookies()).set(CART_COOKIE, c.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return c.id;
}

/** Move a guest cart's items into the user's cart after login. */
export async function mergeGuestCart(userId: string) {
  const db = getDb();
  const jar = await cookies();
  const gid = await guestCartId();
  if (!gid) return;
  const guestItems = await db.select().from(cartItems).where(eq(cartItems.cartId, gid));
  if (guestItems.length) {
    let userCart = await db.query.carts.findFirst({ where: eq(carts.userId, userId) });
    if (!userCart) [userCart] = await db.insert(carts).values({ userId }).returning();
    for (const it of guestItems) {
      await db
        .insert(cartItems)
        .values({ cartId: userCart.id, variantId: it.variantId, quantity: it.quantity })
        .onConflictDoUpdate({
          target: [cartItems.cartId, cartItems.variantId],
          set: { quantity: sql`least(${cartItems.quantity} + ${it.quantity}, ${MAX_LINE_QTY})` },
        });
    }
  }
  await db.delete(carts).where(and(eq(carts.id, gid), sql`${carts.userId} is null`));
  jar.delete(CART_COOKIE);
}

export type CartLine = {
  variantId: string;
  productId: string;
  productName: string;
  productNameBn: string | null;
  productSlug: string;
  variantName: string;
  unit: string;
  image: string | null;
  categoryName: string | null;
  categoryNameBn: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  stock: number;
  available: boolean;
  issue: string | null;
  lineTotal: number;
};

export async function loadCartLines(db: DB, cartId: string): Promise<CartLine[]> {
  const rows = await db
    .select({
      quantity: cartItems.quantity,
      v: productVariants,
      p: {
        id: products.id,
        name: products.name,
        nameBn: products.nameBn,
        slug: products.slug,
        unit: products.unit,
        images: products.images,
        isActive: products.isActive,
      },
      categoryName: categories.name,
      categoryNameBn: categories.nameBn,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(productVariants.id, cartItems.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.createdAt));

  return rows.map((r) => {
    let issue: string | null = null;
    if (!r.p.isActive) issue = "No longer available";
    else if (r.v.stock <= 0) issue = "Out of stock";
    else if (r.quantity > r.v.stock) issue = `Only ${r.v.stock} left`;
    const available = issue === null;
    return {
      variantId: r.v.id,
      productId: r.p.id,
      productName: r.p.name,
      productNameBn: r.p.nameBn,
      productSlug: r.p.slug,
      variantName: r.v.name,
      unit: r.p.unit,
      image: r.p.images[0] ?? null,
      categoryName: r.categoryName,
      categoryNameBn: r.categoryNameBn,
      unitPrice: r.v.price,
      compareAtPrice: r.v.compareAtPrice,
      quantity: r.quantity,
      stock: r.v.stock,
      available,
      issue,
      lineTotal: r.v.price * r.quantity,
    };
  });
}

export const getCart = cache(async () => {
  const cartId = await resolveCartId(false);
  if (!cartId) return { cartId: null, lines: [] as CartLine[] };
  return { cartId, lines: await loadCartLines(getDb(), cartId) };
});

export const getCartCount = cache(async () => {
  const { lines } = await getCart();
  return lines.reduce((s, l) => s + l.quantity, 0);
});

export async function addToCart(variantId: string, qty: number) {
  const db = getDb();
  const v = await db
    .select({ stock: productVariants.stock, active: products.isActive })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(eq(productVariants.id, variantId))
    .limit(1);
  if (!v[0] || !v[0].active) return { ok: false as const, error: "This product is not available." };
  if (v[0].stock <= 0) return { ok: false as const, error: "Sorry, this item is out of stock." };
  const cartId = (await resolveCartId(true))!;
  const existing = await db.query.cartItems.findFirst({
    where: and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)),
  });
  const desired = Math.min((existing?.quantity ?? 0) + qty, v[0].stock, MAX_LINE_QTY);
  await db
    .insert(cartItems)
    .values({ cartId, variantId, quantity: desired })
    .onConflictDoUpdate({ target: [cartItems.cartId, cartItems.variantId], set: { quantity: desired } });
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
  const capped = desired < (existing?.quantity ?? 0) + qty;
  return { ok: true as const, capped, quantity: desired };
}

export async function setCartQuantity(variantId: string, qty: number) {
  const db = getDb();
  const cartId = await resolveCartId(false);
  if (!cartId) return;
  if (qty <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)));
    return;
  }
  const v = await db.query.productVariants.findFirst({ where: eq(productVariants.id, variantId) });
  const q = Math.max(1, Math.min(qty, v?.stock ?? 0, MAX_LINE_QTY));
  await db
    .update(cartItems)
    .set({ quantity: q })
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)));
}

export async function clearCart() {
  const cartId = await resolveCartId(false);
  if (cartId) await getDb().delete(cartItems).where(eq(cartItems.cartId, cartId));
}

export async function listActiveZones() {
  return getDb()
    .select()
    .from(deliveryZones)
    .where(eq(deliveryZones.isActive, true))
    .orderBy(asc(deliveryZones.sortOrder), asc(deliveryZones.name));
}

/** Preferred zone from the "Deliver to" cookie, else the first active zone. */
export async function getPreferredZone() {
  const zones = await listActiveZones();
  const id = (await cookies()).get(ZONE_COOKIE)?.value;
  return { zones, zone: zones.find((z) => z.id === id) ?? zones[0] ?? null };
}
