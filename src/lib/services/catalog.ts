import "server-only";
import { and, asc, desc, eq, exists, gt, gte, ilike, inArray, isNotNull, lte, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { categories, productVariants, products, reviews, users, wishlistItems } from "@/lib/db/schema";

export type ProductCardData = {
  id: string;
  name: string;
  nameBn: string | null;
  slug: string;
  unit: string;
  image: string | null;
  isOrganic: boolean;
  freshnessLabel: string | null;
  ratingAvg: number;
  ratingCount: number;
  variantId: string | null;
  variantName: string | null;
  price: number;
  compareAtPrice: number | null;
  minPrice: number;
  maxPrice: number;
  stock: number;
  variantCount: number;
  categoryName: string | null;
  categoryNameBn: string | null;
};

export type SortKey = "popular" | "newest" | "price_asc" | "price_desc" | "name";

export type ProductFilters = {
  q?: string;
  categoryIds?: string[];
  organic?: boolean;
  inStock?: boolean;
  onSale?: boolean;
  featured?: boolean;
  seasonal?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortKey;
  page?: number;
  perPage?: number;
  excludeId?: string;
};

// Aggregates over variants, computed per product in SQL.
const minPriceSql = sql<number>`(select min(v.price) from product_variants v where v.product_id = ${products.id})`;
const totalStockSql = sql<number>`(select coalesce(sum(v.stock),0) from product_variants v where v.product_id = ${products.id})`;

function filterWhere(f: ProductFilters): SQL | undefined {
  const conds: (SQL | undefined)[] = [eq(products.isActive, true)];
  if (f.q) {
    const term = `%${f.q.replace(/[%_\\]/g, (m) => "\\" + m)}%`;
    conds.push(
      or(
        ilike(products.name, term),
        ilike(products.nameBn, term),
        ilike(products.descriptionBn, term),
        ilike(products.description, term),
        exists(
          getDb()
            .select({ x: sql`1` })
            .from(categories)
            .where(and(eq(categories.id, products.categoryId), or(ilike(categories.name, term), ilike(categories.nameBn, term)))),
        ),
      ),
    );
  }
  if (f.categoryIds?.length) conds.push(inArray(products.categoryId, f.categoryIds));
  if (f.organic) conds.push(eq(products.isOrganic, true));
  if (f.featured) conds.push(eq(products.isFeatured, true));
  if (f.seasonal) conds.push(eq(products.isSeasonal, true));
  if (f.excludeId) conds.push(sql`${products.id} <> ${f.excludeId}`);
  if (f.inStock) conds.push(gt(totalStockSql, 0));
  if (f.onSale)
    conds.push(
      exists(
        getDb()
          .select({ x: sql`1` })
          .from(productVariants)
          .where(
            and(
              eq(productVariants.productId, products.id),
              isNotNull(productVariants.compareAtPrice),
              gt(productVariants.compareAtPrice, productVariants.price),
            ),
          ),
      ),
    );
  if (f.minPrice !== undefined) conds.push(gte(minPriceSql, f.minPrice));
  if (f.maxPrice !== undefined) conds.push(lte(minPriceSql, f.maxPrice));
  return and(...conds);
}

function orderBy(sort: SortKey = "popular") {
  switch (sort) {
    case "newest":
      return [desc(products.createdAt)];
    case "price_asc":
      return [asc(minPriceSql), asc(products.name)];
    case "price_desc":
      return [desc(minPriceSql), asc(products.name)];
    case "name":
      return [asc(products.name)];
    default:
      return [desc(products.soldCount), desc(products.isFeatured), asc(products.name)];
  }
}

/** For searches: products whose own name matches rank above category/description matches. */
function nameMatchFirst(q: string) {
  const term = `%${q.replace(/[%_\\]/g, (m) => "\\" + m)}%`;
  return sql`case when ${products.name} ilike ${term} or ${products.nameBn} ilike ${term} then 0 else 1 end`;
}

async function hydrateCards(rows: { id: string }[]): Promise<ProductCardData[]> {
  if (rows.length === 0) return [];
  const db = getDb();
  const ids = rows.map((r) => r.id);
  const [prods, variants] = await Promise.all([
    db
      .select({ p: products, categoryName: categories.name, categoryNameBn: categories.nameBn })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(inArray(products.id, ids)),
    db
      .select()
      .from(productVariants)
      .where(inArray(productVariants.productId, ids))
      .orderBy(asc(productVariants.sortOrder), asc(productVariants.price)),
  ]);
  const byId = new Map(prods.map((r) => [r.p.id, r]));
  return ids
    .map((id): ProductCardData | null => {
      const r = byId.get(id);
      if (!r) return null;
      const vs = variants.filter((v) => v.productId === id);
      const def = vs.find((v) => v.isDefault && v.stock > 0) ?? vs.find((v) => v.stock > 0) ?? vs.find((v) => v.isDefault) ?? vs[0];
      const prices = vs.map((v) => v.price);
      return {
        id,
        name: r.p.name,
        nameBn: r.p.nameBn,
        slug: r.p.slug,
        unit: r.p.unit,
        image: r.p.images[0] ?? null,
        isOrganic: r.p.isOrganic,
        freshnessLabel: r.p.freshnessLabel,
        ratingAvg: r.p.ratingAvg,
        ratingCount: r.p.ratingCount,
        variantId: def?.id ?? null,
        variantName: def?.name ?? null,
        price: def?.price ?? 0,
        compareAtPrice: def?.compareAtPrice ?? null,
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
        stock: vs.reduce((s, v) => s + v.stock, 0),
        variantCount: vs.length,
        categoryName: r.categoryName,
        categoryNameBn: r.categoryNameBn,
      };
    })
    .filter((x): x is ProductCardData => x !== null);
}

export async function listProducts(f: ProductFilters = {}) {
  const db = getDb();
  const perPage = Math.min(f.perPage ?? 24, 60);
  const page = Math.max(f.page ?? 1, 1);
  const where = filterWhere(f);
  const [rows, countRows] = await Promise.all([
    db
      .select({ id: products.id })
      .from(products)
      .where(where)
      .orderBy(...(f.q ? [nameMatchFirst(f.q), ...orderBy(f.sort)] : orderBy(f.sort)))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ n: sql<number>`count(*)::int` }).from(products).where(where),
  ]);
  const total = countRows[0]?.n ?? 0;
  return { items: await hydrateCards(rows), total, page, perPage, pages: Math.max(Math.ceil(total / perPage), 1) };
}

export async function listCategories(opts: { includeInactive?: boolean } = {}) {
  const db = getDb();
  const rows = await db
    .select({
      c: categories,
      productCount: sql<number>`(select count(*)::int from products p where p.category_id = ${categories.id} and p.is_active)`,
    })
    .from(categories)
    .where(opts.includeInactive ? undefined : eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  return rows.map((r) => ({ ...r.c, productCount: r.productCount }));
}

export async function getCategoryBySlug(slug: string) {
  const db = getDb();
  const cat = await db.query.categories.findFirst({ where: and(eq(categories.slug, slug), eq(categories.isActive, true)) });
  if (!cat) return null;
  const children = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.parentId, cat.id), eq(categories.isActive, true)));
  return { ...cat, ids: [cat.id, ...children.map((c) => c.id)] };
}

export async function getProductBySlug(slug: string) {
  const db = getDb();
  const p = await db.query.products.findFirst({ where: and(eq(products.slug, slug), eq(products.isActive, true)) });
  if (!p) return null;
  const [variants, category] = await Promise.all([
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, p.id))
      .orderBy(asc(productVariants.sortOrder), asc(productVariants.price)),
    p.categoryId ? db.query.categories.findFirst({ where: eq(categories.id, p.categoryId) }) : Promise.resolve(undefined),
  ]);
  return { ...p, variants, category: category ?? null };
}

export async function getApprovedReviews(productId: string, limit = 20) {
  const db = getDb();
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      createdAt: reviews.createdAt,
      userName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}

export async function getTestimonials(limit = 3) {
  const db = getDb();
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      userName: users.name,
      productName: products.name,
      productNameBn: products.nameBn,
      productSlug: products.slug,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .innerJoin(products, eq(products.id, reviews.productId))
    .where(and(eq(reviews.status, "approved"), gte(reviews.rating, 4)))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}

export async function getWishlistIds(userId: string | undefined): Promise<Set<string>> {
  if (!userId) return new Set();
  const rows = await getDb()
    .select({ id: wishlistItems.productId })
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId));
  return new Set(rows.map((r) => r.id));
}

export async function getWishlistProducts(userId: string) {
  const rows = await getDb()
    .select({ id: wishlistItems.productId })
    .from(wishlistItems)
    .innerJoin(products, eq(products.id, wishlistItems.productId))
    .where(and(eq(wishlistItems.userId, userId), eq(products.isActive, true)))
    .orderBy(desc(wishlistItems.createdAt));
  return hydrateCards(rows);
}
