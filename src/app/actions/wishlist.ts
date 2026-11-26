"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { products, wishlistItems } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export async function toggleWishlistAction(productId: string): Promise<{ ok: boolean; saved?: boolean; needsLogin?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, needsLogin: true };
  const id = z.string().uuid().safeParse(productId);
  if (!id.success) return { ok: false };
  const db = getDb();
  const product = await db.query.products.findFirst({ where: eq(products.id, id.data) });
  if (!product) return { ok: false };
  const where = and(eq(wishlistItems.userId, user.id), eq(wishlistItems.productId, id.data));
  const existing = await db.query.wishlistItems.findFirst({ where });
  if (existing) await db.delete(wishlistItems).where(where);
  else await db.insert(wishlistItems).values({ userId: user.id, productId: id.data }).onConflictDoNothing();
  revalidatePath("/account/wishlist");
  return { ok: true, saved: !existing };
}
