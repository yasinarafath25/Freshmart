import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { orderItems, orders, reviews } from "@/lib/db/schema";

/** Verified purchase only: the customer must have a delivered order containing the product. */
export async function canReview(userId: string, productId: string) {
  const db = getDb();
  const [bought, existing] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(eq(orders.userId, userId), eq(orders.status, "delivered"), eq(orderItems.productId, productId))),
    db.query.reviews.findFirst({ where: and(eq(reviews.userId, userId), eq(reviews.productId, productId)) }),
  ]);
  return { eligible: (bought[0]?.n ?? 0) > 0 && !existing, alreadyReviewed: !!existing, purchased: (bought[0]?.n ?? 0) > 0 };
}

