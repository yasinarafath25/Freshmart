"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, ne, notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import {
  categories, contactMessages, coupons, deliveryZones, inventoryMovements, productVariants, products, reviews, roles, users,
} from "@/lib/db/schema";
import { AuthError, requireStaff } from "@/lib/auth/guards";
import { PERMISSIONS, type Permission } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { destroyAllSessions } from "@/lib/auth/session";
import { audit } from "@/lib/services/audit";
import { storeImage } from "@/lib/services/media";
import { CheckoutError, markCodPaid, updateOrderStatus } from "@/lib/services/orders";
import { saveSettings, storeSettingsSchema } from "@/lib/services/settings";
import { fieldErrors, password as passwordSchema, email as emailSchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils/slug";
import { toMinor } from "@/lib/utils/money";

export type AdminState = { ok?: boolean; message?: string; errors?: Record<string, string> } | null;

async function guard(p: Permission) {
  try {
    return await requireStaff(p);
  } catch (e) {
    if (e instanceof AuthError) return null;
    throw e;
  }
}
const DENIED: AdminState = { ok: false, message: "You don’t have permission to do this." };
const uuid = z.string().uuid();
const money = z.coerce.number().min(0, "Must be 0 or more.").max(10_000_000).transform((n) => toMinor(n));
const optMoney = z.union([z.literal("").transform(() => null), money]).nullable().optional();
const bool = (v: FormDataEntryValue | null) => v === "on" || v === "true" || v === "1";

// ─── Images ─────────────────────────────────────────────────────────────────
export async function uploadImageAction(formData: FormData): Promise<{ url?: string; error?: string }> {
  const user = await guard("products:write");
  if (!user) return { error: "Not allowed." };
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No file uploaded." };
  const res = await storeImage(file);
  if ("error" in res) return { error: res.error };
  await audit(user.id, "upload", "image", res.url);
  return { url: res.url };
}

// ─── Products ───────────────────────────────────────────────────────────────
const variantSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Variant name is required.").max(60),
  sku: z.string().trim().min(1, "SKU is required.").max(60),
  price: money,
  compareAtPrice: optMoney,
  stock: z.coerce.number().int().min(0).max(1_000_000),
  isDefault: z.boolean().optional(),
});

const productSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2, "Name is required.").max(120),
  nameBn: z.string().trim().max(120).optional(),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(5000).default(""),
  descriptionBn: z.string().trim().max(5000).optional(),
  categoryId: z.string().uuid("Choose a category.").nullable(),
  unit: z.enum(["kg", "g", "piece", "dozen", "bunch", "pack", "litre", "ml"]),
  origin: z.string().trim().max(80).optional(),
  freshnessLabel: z.string().trim().max(30).optional(),
  images: z.array(z.string().regex(/^(\/media\/products\/|\/images\/|https:\/\/)/, "Invalid image URL.").max(500)).max(8),
  variants: z.array(variantSchema).min(1, "Add at least one variant.").max(20),
});

export async function saveProductAction(_: AdminState, formData: FormData): Promise<AdminState> {
  const user = await guard("products:write");
  if (!user) return DENIED;
  let variantsRaw: unknown, imagesRaw: unknown;
  try {
    variantsRaw = JSON.parse(String(formData.get("variants") ?? "[]"));
    imagesRaw = JSON.parse(String(formData.get("images") ?? "[]"));
  } catch {
    return { message: "Invalid form data." };
  }
  const parsed = productSchema.safeParse({
    id: formData.get("id") ?? "",
    name: formData.get("name"),
    nameBn: formData.get("nameBn") || undefined,
    slug: formData.get("slug") || undefined,
    description: formData.get("description") ?? "",
    descriptionBn: formData.get("descriptionBn") || undefined,
    categoryId: formData.get("categoryId") || null,
    unit: formData.get("unit"),
    origin: formData.get("origin") || undefined,
    freshnessLabel: formData.get("freshnessLabel") || undefined,
    images: imagesRaw,
    variants: variantsRaw,
  });
  if (!parsed.success) {
    const errs = fieldErrors(parsed.error);
    const vIssue = parsed.error.issues.find((i) => i.path[0] === "variants");
    return { errors: errs, message: vIssue ? `Variant ${Number(vIssue.path[1] ?? 0) + 1}: ${vIssue.message}` : "Please fix the highlighted fields." };
  }
  const d = parsed.data;
  for (const v of d.variants) if (v.compareAtPrice !== null && v.compareAtPrice !== undefined && v.compareAtPrice <= v.price) v.compareAtPrice = null;
  const skus = d.variants.map((v) => v.sku.toUpperCase());
  if (new Set(skus).size !== skus.length) return { message: "Each variant needs a unique SKU." };
  const slug = slugify(d.slug || d.name);
  if (!slug) return { errors: { slug: "Slug is required." } };

  const db = getDb();
  const productId = d.id || null;
  const clashSlug = await db.query.products.findFirst({ where: productId ? and(eq(products.slug, slug), ne(products.id, productId)) : eq(products.slug, slug) });
  if (clashSlug) return { errors: { slug: "Another product already uses this URL slug." } };
  const existingSkus = await db.select({ id: productVariants.id, sku: productVariants.sku, productId: productVariants.productId }).from(productVariants).where(inArray(productVariants.sku, skus));
  const foreign = existingSkus.find((s) => s.productId !== productId);
  if (foreign) return { message: `SKU ${foreign.sku} is already used by another product.` };

  const values = {
    name: d.name,
    nameBn: d.nameBn || null,
    slug,
    description: d.description,
    descriptionBn: d.descriptionBn || null,
    categoryId: d.categoryId,
    unit: d.unit,
    origin: d.origin ?? null,
    freshnessLabel: d.freshnessLabel ?? null,
    images: d.images,
    isOrganic: bool(formData.get("isOrganic")),
    isFeatured: bool(formData.get("isFeatured")),
    isSeasonal: bool(formData.get("isSeasonal")),
    isActive: bool(formData.get("isActive")),
  };
  const defaultIdx = Math.max(0, d.variants.findIndex((v) => v.isDefault));

  const savedId = await db.transaction(async (tx) => {
    let id = productId;
    if (id) {
      const res = await tx.update(products).set(values).where(eq(products.id, id)).returning({ id: products.id });
      if (!res[0]) throw new CheckoutError("Product not found.");
    } else {
      const [row] = await tx.insert(products).values(values).returning({ id: products.id });
      id = row.id;
    }
    const current = await tx.select().from(productVariants).where(eq(productVariants.productId, id));
    const keepIds = d.variants.map((v) => v.id).filter((x): x is string => !!x && current.some((c) => c.id === x));
    if (current.length) {
      await tx.delete(productVariants).where(and(eq(productVariants.productId, id), keepIds.length ? notInArray(productVariants.id, keepIds) : sql`true`));
    }
    for (const [i, v] of d.variants.entries()) {
      const row = { name: v.name, sku: v.sku.toUpperCase(), price: v.price, compareAtPrice: v.compareAtPrice ?? null, stock: v.stock, isDefault: i === defaultIdx, sortOrder: i };
      const prev = v.id ? current.find((c) => c.id === v.id) : undefined;
      if (prev) {
        await tx.update(productVariants).set(row).where(eq(productVariants.id, prev.id));
        if (prev.stock !== v.stock)
          await tx.insert(inventoryMovements).values({ variantId: prev.id, change: v.stock - prev.stock, reason: "adjustment", reference: "Product editor", actorId: user.id });
      } else {
        const [nv] = await tx.insert(productVariants).values({ ...row, productId: id }).returning({ id: productVariants.id });
        if (v.stock > 0) await tx.insert(inventoryMovements).values({ variantId: nv.id, change: v.stock, reason: "restock", reference: "Initial stock", actorId: user.id });
      }
    }
    return id;
  }).catch((e) => (e instanceof CheckoutError ? null : Promise.reject(e)));
  if (!savedId) return { message: "Product not found." };

  await audit(user.id, productId ? "update" : "create", "product", savedId, { name: d.name });
  revalidatePath("/", "layout");
  redirect(`/admin/products?saved=1`);
}

export async function deleteProductAction(formData: FormData) {
  const user = await guard("products:write");
  if (!user) return;
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  await getDb().delete(products).where(eq(products.id, id.data));
  await audit(user.id, "delete", "product", id.data);
  revalidatePath("/", "layout");
}

export async function toggleProductActiveAction(formData: FormData) {
  const user = await guard("products:write");
  if (!user) return;
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  await getDb().update(products).set({ isActive: sql`not ${products.isActive}` }).where(eq(products.id, id.data));
  await audit(user.id, "toggle-active", "product", id.data);
  revalidatePath("/", "layout");
}

// ─── Categories ─────────────────────────────────────────────────────────────
const categorySchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2, "Name is required.").max(60),
  nameBn: z.string().trim().max(60).optional(),
  slug: z.string().trim().max(60).optional(),
  description: z.string().trim().max(300).optional(),
  descriptionBn: z.string().trim().max(300).optional(),
  image: z.string().trim().max(300).regex(/^(|\/media\/products\/|\/images\/|https:\/\/)/, "Invalid image URL.").optional(),
  parentId: z.string().uuid().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export async function saveCategoryAction(_: AdminState, formData: FormData): Promise<AdminState> {
  const user = await guard("products:write");
  if (!user) return DENIED;
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const slug = slugify(d.slug || d.name);
  const db = getDb();
  const clash = await db.query.categories.findFirst({ where: d.id ? and(eq(categories.slug, slug), ne(categories.id, d.id)) : eq(categories.slug, slug) });
  if (clash) return { errors: { slug: "Slug already in use." } };
  if (d.id && d.parentId === d.id) return { errors: { parentId: "A category can’t be its own parent." } };
  const values = { name: d.name, nameBn: d.nameBn || null, descriptionBn: d.descriptionBn || null, slug, description: d.description || null, image: d.image || null, parentId: d.parentId || null, sortOrder: d.sortOrder, isActive: bool(formData.get("isActive")) };
  if (d.id) await db.update(categories).set(values).where(eq(categories.id, d.id));
  else await db.insert(categories).values(values);
  await audit(user.id, d.id ? "update" : "create", "category", d.id || slug);
  revalidatePath("/", "layout");
  return { ok: true, message: "Category saved." };
}

export async function deleteCategoryAction(formData: FormData) {
  const user = await guard("products:write");
  if (!user) return;
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  const db = getDb();
  await db.update(categories).set({ parentId: null }).where(eq(categories.parentId, id.data));
  await db.delete(categories).where(eq(categories.id, id.data)); // products.category_id → set null
  await audit(user.id, "delete", "category", id.data);
  revalidatePath("/", "layout");
}

// ─── Inventory ──────────────────────────────────────────────────────────────
export async function adjustStockAction(_: AdminState, formData: FormData): Promise<AdminState> {
  const user = await guard("inventory:write");
  if (!user) return DENIED;
  const parsed = z
    .object({
      variantId: uuid,
      change: z.coerce.number().int().refine((n) => n !== 0, "Enter a non-zero amount.").refine((n) => Math.abs(n) <= 100000, "Too large."),
      reason: z.enum(["restock", "adjustment"]),
      note: z.string().trim().max(120).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: parsed.error.issues[0].message };
  const d = parsed.data;
  const db = getDb();
  const updated = await db
    .update(productVariants)
    .set({ stock: sql`${productVariants.stock} + ${d.change}` })
    .where(and(eq(productVariants.id, d.variantId), sql`${productVariants.stock} + ${d.change} >= 0`))
    .returning({ stock: productVariants.stock });
  if (!updated[0]) return { message: "Stock can’t go below zero." };
  await db.insert(inventoryMovements).values({ variantId: d.variantId, change: d.change, reason: d.reason, reference: d.note || null, actorId: user.id });
  await audit(user.id, "adjust-stock", "variant", d.variantId, { change: d.change });
  revalidatePath("/admin/inventory");
  revalidatePath("/", "layout");
  return { ok: true, message: `Stock updated to ${updated[0].stock}.` };
}

// ─── Orders ─────────────────────────────────────────────────────────────────
export async function updateOrderStatusAction(_: AdminState, formData: FormData): Promise<AdminState> {
  const user = await guard("orders:write");
  if (!user) return DENIED;
  const parsed = z
    .object({ orderId: uuid, status: z.enum(["confirmed", "processing", "out_for_delivery", "delivered", "cancelled"]), note: z.string().trim().max(300).optional() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: "Choose a valid status." };
  try {
    await updateOrderStatus({ orderId: parsed.data.orderId, to: parsed.data.status, note: parsed.data.note || null, actorId: user.id });
  } catch (e) {
    if (e instanceof CheckoutError) return { message: e.message };
    throw e;
  }
  await audit(user.id, `status:${parsed.data.status}`, "order", parsed.data.orderId);
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true, message: "Order updated." };
}

export async function markOrderPaidAction(_: AdminState, formData: FormData): Promise<AdminState> {
  const user = await guard("orders:write");
  if (!user) return DENIED;
  const id = uuid.safeParse(formData.get("orderId"));
  if (!id.success) return { message: "Invalid order." };
  try {
    await markCodPaid(id.data, user.id);
  } catch (e) {
    if (e instanceof CheckoutError) return { message: e.message };
    throw e;
  }
  await audit(user.id, "mark-paid", "order", id.data);
  revalidatePath(`/admin/orders/${id.data}`);
  return { ok: true, message: "Payment recorded." };
}

// ─── Customers & staff ──────────────────────────────────────────────────────
export async function setUserStatusAction(formData: FormData) {
  const id = uuid.safeParse(formData.get("id"));
  const status = z.enum(["active", "blocked"]).safeParse(formData.get("status"));
  if (!id.success || !status.success) return;
  const db = getDb();
  const target = await db.query.users.findFirst({ where: eq(users.id, id.data) });
  if (!target) return;
  const user = await guard(target.role === "staff" ? "users:write" : "customers:write");
  if (!user || user.id === target.id) return;
  await db.update(users).set({ status: status.data }).where(eq(users.id, target.id));
  if (status.data === "blocked") await destroyAllSessions(target.id);
  await audit(user.id, `user:${status.data}`, "user", target.id);
  revalidatePath("/admin/customers");
  revalidatePath("/admin/users");
}

export async function saveStaffUserAction(_: AdminState, formData: FormData): Promise<AdminState> {
  const user = await guard("users:write");
  if (!user) return DENIED;
  const parsed = z
    .object({ id: z.string().uuid().optional().or(z.literal("")), name: z.string().trim().min(2).max(80), email: emailSchema, roleId: uuid, password: z.string().optional() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const db = getDb();
  const role = await db.query.roles.findFirst({ where: eq(roles.id, d.roleId) });
  if (!role) return { errors: { roleId: "Choose a role." } };
  if (d.id) {
    if (d.id === user.id && role.permissions.indexOf("*") === -1 && user.permissions.includes("*")) return { message: "You can’t remove your own Super Admin role." };
    const set: Partial<typeof users.$inferInsert> = { name: d.name, staffRoleId: role.id, role: "staff" };
    if (d.password) {
      const pw = passwordSchema.safeParse(d.password);
      if (!pw.success) return { errors: { password: pw.error.issues[0].message } };
      set.passwordHash = await hashPassword(pw.data);
    }
    await db.update(users).set(set).where(eq(users.id, d.id));
    if (d.password) await destroyAllSessions(d.id);
  } else {
    const existing = await db.query.users.findFirst({ where: eq(users.email, d.email) });
    if (existing) {
      if (existing.role === "staff") return { errors: { email: "This person is already a staff member." } };
      // Promote an existing customer account; their password stays theirs.
      await db.update(users).set({ role: "staff", staffRoleId: role.id }).where(eq(users.id, existing.id));
    } else {
      const pw = passwordSchema.safeParse(d.password);
      if (!pw.success) return { errors: { password: pw.error.issues[0].message } };
      await db.insert(users).values({ name: d.name, email: d.email, role: "staff", staffRoleId: role.id, passwordHash: await hashPassword(pw.data) });
    }
  }
  await audit(user.id, d.id ? "update" : "create", "staff", d.id || d.email, { role: role.name });
  revalidatePath("/admin/users");
  return { ok: true, message: "Staff user saved." };
}

export async function removeStaffAction(formData: FormData) {
  const user = await guard("users:write");
  if (!user) return;
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success || id.data === user.id) return;
  await getDb().update(users).set({ role: "customer", staffRoleId: null }).where(eq(users.id, id.data));
  await destroyAllSessions(id.data);
  await audit(user.id, "remove-staff", "user", id.data);
  revalidatePath("/admin/users");
}

export async function saveRoleAction(_: AdminState, formData: FormData): Promise<AdminState> {
  const user = await guard("roles:write");
  if (!user) return DENIED;
  const id = z.string().uuid().optional().or(z.literal("")).safeParse(formData.get("id") ?? "");
  const name = z.string().trim().min(2, "Name is required.").max(40).safeParse(formData.get("name"));
  if (!name.success) return { errors: { name: name.error.issues[0].message } };
  const perms = formData.getAll("permissions").map(String).filter((p): p is Permission => (PERMISSIONS as readonly string[]).includes(p));
  const db = getDb();
  if (id.success && id.data) {
    const role = await db.query.roles.findFirst({ where: eq(roles.id, id.data) });
    if (!role) return { message: "Role not found." };
    if (role.isSystem) return { message: "The Super Admin role can’t be edited." };
    await db.update(roles).set({ name: name.data, description: String(formData.get("description") ?? "").slice(0, 200) || null, permissions: perms }).where(eq(roles.id, role.id));
  } else {
    const clash = await db.query.roles.findFirst({ where: eq(roles.name, name.data) });
    if (clash) return { errors: { name: "A role with this name exists." } };
    await db.insert(roles).values({ name: name.data, description: String(formData.get("description") ?? "").slice(0, 200) || null, permissions: perms });
  }
  await audit(user.id, "save", "role", name.data, { perms });
  revalidatePath("/admin/roles");
  return { ok: true, message: "Role saved." };
}

export async function deleteRoleAction(formData: FormData) {
  const user = await guard("roles:write");
  if (!user) return;
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  const db = getDb();
  const role = await db.query.roles.findFirst({ where: eq(roles.id, id.data) });
  if (!role || role.isSystem) return;
  const inUse = await db.$count(users, eq(users.staffRoleId, role.id));
  if (inUse > 0) return;
  await db.delete(roles).where(eq(roles.id, role.id));
  await audit(user.id, "delete", "role", role.id);
  revalidatePath("/admin/roles");
}

// ─── Coupons ────────────────────────────────────────────────────────────────
export async function saveCouponAction(_: AdminState, formData: FormData): Promise<AdminState> {
  const user = await guard("coupons:write");
  if (!user) return DENIED;
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = z
    .object({
      id: z.string().uuid().optional().or(z.literal("")),
      code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "3–30 letters, numbers, - or _."),
      description: z.string().trim().max(120).optional(),
      type: z.enum(["percent", "fixed", "free_delivery"]),
      value: z.coerce.number().min(0).max(10_000_000),
      minOrder: money,
      maxDiscount: optMoney,
      startsAt: z.string().optional(),
      endsAt: z.string().optional(),
      usageLimit: z.union([z.literal(""), z.coerce.number().int().min(1)]).optional(),
      perUserLimit: z.coerce.number().int().min(0).max(1000).default(1),
    })
    .safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  if (d.type === "percent" && (d.value <= 0 || d.value > 100)) return { errors: { value: "Percentage must be between 1 and 100." } };
  if (d.type === "fixed" && d.value <= 0) return { errors: { value: "Enter the discount amount." } };
  const startsAt = d.startsAt ? new Date(d.startsAt) : null;
  const endsAt = d.endsAt ? new Date(d.endsAt) : null;
  if ((startsAt && isNaN(+startsAt)) || (endsAt && isNaN(+endsAt))) return { message: "Invalid dates." };
  if (startsAt && endsAt && endsAt <= startsAt) return { errors: { endsAt: "End must be after start." } };
  const values = {
    code: d.code,
    description: d.description || null,
    type: d.type,
    value: d.type === "fixed" ? toMinor(d.value) : d.type === "percent" ? Math.round(d.value) : 0,
    minOrder: d.minOrder,
    maxDiscount: d.maxDiscount ?? null,
    startsAt,
    endsAt,
    usageLimit: d.usageLimit === "" || d.usageLimit === undefined ? null : d.usageLimit,
    perUserLimit: d.perUserLimit,
    isPublic: bool(formData.get("isPublic")),
    isActive: bool(formData.get("isActive")),
  };
  const db = getDb();
  const clash = await db.query.coupons.findFirst({ where: d.id ? and(eq(coupons.code, d.code), ne(coupons.id, d.id)) : eq(coupons.code, d.code) });
  if (clash) return { errors: { code: "This code already exists." } };
  if (d.id) await db.update(coupons).set(values).where(eq(coupons.id, d.id));
  else await db.insert(coupons).values(values);
  await audit(user.id, d.id ? "update" : "create", "coupon", d.code);
  revalidatePath("/admin/coupons");
  revalidatePath("/offers");
  return { ok: true, message: "Coupon saved." };
}

export async function deleteCouponAction(formData: FormData) {
  const user = await guard("coupons:write");
  if (!user) return;
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  await getDb().delete(coupons).where(eq(coupons.id, id.data));
  await audit(user.id, "delete", "coupon", id.data);
  revalidatePath("/admin/coupons");
}

// ─── Delivery ───────────────────────────────────────────────────────────────
export async function saveZoneAction(_: AdminState, formData: FormData): Promise<AdminState> {
  const user = await guard("delivery:write");
  if (!user) return DENIED;
  const parsed = z
    .object({
      id: z.string().uuid().optional().or(z.literal("")),
      name: z.string().trim().min(2).max(60),
      nameBn: z.string().trim().max(60).optional(),
      etaTextBn: z.string().trim().max(60).optional(),
      fee: money,
      freeAbove: optMoney,
      etaText: z.string().trim().min(2).max(60),
      sortOrder: z.coerce.number().int().min(0).max(999).default(0),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const values = { name: d.name, nameBn: d.nameBn || null, etaTextBn: d.etaTextBn || null, fee: d.fee, freeAbove: d.freeAbove ?? null, etaText: d.etaText, sortOrder: d.sortOrder, isActive: bool(formData.get("isActive")) };
  const db = getDb();
  if (d.id) await db.update(deliveryZones).set(values).where(eq(deliveryZones.id, d.id));
  else await db.insert(deliveryZones).values(values);
  await audit(user.id, d.id ? "update" : "create", "zone", d.id || d.name);
  revalidatePath("/", "layout");
  return { ok: true, message: "Delivery area saved." };
}

export async function deleteZoneAction(formData: FormData) {
  const user = await guard("delivery:write");
  if (!user) return;
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  await getDb().delete(deliveryZones).where(eq(deliveryZones.id, id.data));
  await audit(user.id, "delete", "zone", id.data);
  revalidatePath("/", "layout");
}

// ─── Reviews ────────────────────────────────────────────────────────────────
export async function moderateReviewAction(formData: FormData) {
  const user = await guard("reviews:write");
  if (!user) return;
  const id = uuid.safeParse(formData.get("id"));
  const status = z.enum(["approved", "rejected", "pending"]).safeParse(formData.get("status"));
  if (!id.success || !status.success) return;
  const db = getDb();
  const [r] = await db.update(reviews).set({ status: status.data }).where(eq(reviews.id, id.data)).returning();
  if (!r) return;
  const agg = await db
    .select({ avg: sql<number>`coalesce(avg(${reviews.rating}),0)::float`, n: sql<number>`count(*)::int` })
    .from(reviews)
    .where(and(eq(reviews.productId, r.productId), eq(reviews.status, "approved")));
  await db.update(products).set({ ratingAvg: agg[0]?.avg ?? 0, ratingCount: agg[0]?.n ?? 0 }).where(eq(products.id, r.productId));
  await audit(user.id, `review:${status.data}`, "review", r.id);
  revalidatePath("/admin/reviews");
  revalidatePath("/", "layout");
}

// ─── Settings ───────────────────────────────────────────────────────────────
export async function saveSettingsAction(_: AdminState, formData: FormData): Promise<AdminState> {
  const user = await guard("settings:write");
  if (!user) return DENIED;
  const lines = (k: string) => String(formData.get(k) ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  const parsed = storeSettingsSchema.safeParse({
    storeName: formData.get("storeName"),
    tagline: formData.get("tagline"),
    taglineBn: formData.get("taglineBn") ?? "",
    currencySymbol: formData.get("currencySymbol"),
    currencyCode: String(formData.get("currencyCode") ?? "").toUpperCase(),
    supportPhone: formData.get("supportPhone") ?? "",
    supportEmail: formData.get("supportEmail") ?? "",
    address: formData.get("address") ?? "",
    defaultLocation: formData.get("defaultLocation") ?? "",
    timeZone: formData.get("timeZone") || "Asia/Kolkata",
    minOrder: toMinor(String(formData.get("minOrder") ?? "0")),
    freeDeliveryThreshold: toMinor(String(formData.get("freeDeliveryThreshold") ?? "0")),
    lowStockThreshold: Number(formData.get("lowStockThreshold") ?? 10),
    deliverySlots: lines("deliverySlots"),
    codEnabled: bool(formData.get("codEnabled")),
    announcements: lines("announcements").slice(0, 3),
    announcementsBn: lines("announcementsBn").slice(0, 3),
    socialFacebook: formData.get("socialFacebook") ?? "",
    socialInstagram: formData.get("socialInstagram") ?? "",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  if (parsed.data.deliverySlots.length === 0) return { errors: { deliverySlots: "Add at least one delivery slot." } };
  await saveSettings(parsed.data);
  await audit(user.id, "update", "settings", "store");
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}

// ─── Messages ───────────────────────────────────────────────────────────────
export async function markMessageHandledAction(formData: FormData) {
  const user = await guard("customers:read");
  if (!user) return;
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  await getDb().update(contactMessages).set({ isHandled: formData.get("handled") !== "0" }).where(eq(contactMessages.id, id.data));
  revalidatePath("/admin/messages");
}
