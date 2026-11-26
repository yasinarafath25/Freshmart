import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { categories, products } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const db = getDb();
  const [cats, prods] = await Promise.all([
    db.select({ slug: categories.slug, updatedAt: categories.updatedAt }).from(categories).where(eq(categories.isActive, true)),
    db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.isActive, true)),
  ]);
  const staticPaths = ["", "/shop", "/fruits", "/vegetables", "/groceries", "/spices", "/organic", "/offers", "/about", "/contact", "/faq", "/privacy-policy", "/terms", "/refund-policy"];
  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.6 })),
    ...cats.map((c) => ({ url: `${base}/category/${c.slug}`, lastModified: c.updatedAt, priority: 0.7 })),
    ...prods.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
  ];
}
