import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  date,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().default(sql`gen_random_uuid()`);
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const userRole = pgEnum("user_role", ["customer", "staff"]);
export const userStatus = pgEnum("user_status", ["active", "blocked"]);
export const orderStatus = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);
export const paymentStatus = pgEnum("payment_status", ["unpaid", "pending", "paid", "failed", "refunded"]);
export const paymentMethod = pgEnum("payment_method", ["cod", "sslcommerz"]);
export const txnStatus = pgEnum("txn_status", ["initiated", "success", "failed", "cancelled"]);
export const couponType = pgEnum("coupon_type", ["percent", "fixed", "free_delivery"]);
export const reviewStatus = pgEnum("review_status", ["pending", "approved", "rejected"]);
export const movementReason = pgEnum("movement_reason", ["order", "cancel", "restock", "adjustment"]);
export const productUnit = pgEnum("product_unit", ["kg", "g", "piece", "dozen", "bunch", "pack", "litre", "ml"]);

// ─── Identity ────────────────────────────────────────────────────────────────
export const roles = pgTable("roles", {
  id: id(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: text("permissions").array().notNull().default(sql`'{}'::text[]`),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: createdAt(),
});

export const users = pgTable(
  "users",
  {
    id: id(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull().default("customer"),
    staffRoleId: uuid("staff_role_id").references(() => roles.id, { onDelete: "set null" }),
    status: userStatus("status").notNull().default("active"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // sha256(token)
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: text("id").primaryKey(), // sha256(token)
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
});

// ─── Delivery ────────────────────────────────────────────────────────────────
export const deliveryZones = pgTable("delivery_zones", {
  id: id(),
  name: text("name").notNull(),
  nameBn: text("name_bn"),
  fee: integer("fee").notNull().default(0),
  freeAbove: integer("free_above"),
  etaText: text("eta_text").notNull().default("Same day"),
  etaTextBn: text("eta_text_bn"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const addresses = pgTable(
  "addresses",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull().default("Home"),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    area: text("area").notNull(),
    city: text("city").notNull(),
    postalCode: text("postal_code"),
    zoneId: uuid("zone_id").references(() => deliveryZones.id, { onDelete: "set null" }),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);

// ─── Catalog ─────────────────────────────────────────────────────────────────
export const categories = pgTable("categories", {
  id: id(),
  name: text("name").notNull(),
  nameBn: text("name_bn"),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  descriptionBn: text("description_bn"),
  image: text("image"),
  parentId: uuid("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const products = pgTable(
  "products",
  {
    id: id(),
    name: text("name").notNull(),
    nameBn: text("name_bn"),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    descriptionBn: text("description_bn"),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    unit: productUnit("unit").notNull().default("kg"),
    images: text("images").array().notNull().default(sql`'{}'::text[]`),
    origin: text("origin"),
    freshnessLabel: text("freshness_label"),
    isOrganic: boolean("is_organic").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    isSeasonal: boolean("is_seasonal").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    ratingAvg: real("rating_avg").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    soldCount: integer("sold_count").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("products_category_idx").on(t.categoryId, t.isActive)],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: id(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sku: text("sku").notNull().unique(),
    price: integer("price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    stock: integer("stock").notNull().default(0),
    isDefault: boolean("is_default").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: id(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    change: integer("change").notNull(),
    reason: movementReason("reason").notNull(),
    reference: text("reference"),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("movements_variant_idx").on(t.variantId, t.createdAt)],
);

// ─── Cart & wishlist ─────────────────────────────────────────────────────────
export const carts = pgTable("carts", {
  id: id(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.cartId, t.variantId] })],
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

// ─── Coupons ─────────────────────────────────────────────────────────────────
export const coupons = pgTable("coupons", {
  id: id(),
  code: text("code").notNull().unique(),
  description: text("description"),
  type: couponType("type").notNull(),
  value: integer("value").notNull().default(0), // percent (0-100) or minor units
  minOrder: integer("min_order").notNull().default(0),
  maxDiscount: integer("max_discount"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  perUserLimit: integer("per_user_limit").notNull().default(1),
  isPublic: boolean("is_public").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAt(),
});

// ─── Orders & payments ───────────────────────────────────────────────────────
export const orders = pgTable(
  "orders",
  {
    id: id(),
    orderNumber: text("order_number").notNull().unique(),
    checkoutToken: text("checkout_token").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: orderStatus("status").notNull().default("pending"),
    paymentMethod: paymentMethod("payment_method").notNull(),
    paymentStatus: paymentStatus("payment_status").notNull().default("unpaid"),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    deliveryFee: integer("delivery_fee").notNull().default(0),
    total: integer("total").notNull(),
    couponCode: text("coupon_code"),
    shipName: text("ship_name").notNull(),
    shipPhone: text("ship_phone").notNull(),
    shipLine1: text("ship_line1").notNull(),
    shipLine2: text("ship_line2"),
    shipArea: text("ship_area").notNull(),
    shipCity: text("ship_city").notNull(),
    shipPostalCode: text("ship_postal_code"),
    zoneId: uuid("zone_id").references(() => deliveryZones.id, { onDelete: "set null" }),
    zoneName: text("zone_name"),
    deliveryDate: date("delivery_date"),
    deliverySlot: text("delivery_slot"),
    notes: text("notes"),
    cancelReason: text("cancel_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("orders_user_idx").on(t.userId, t.createdAt), index("orders_status_idx").on(t.status)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: id(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    productNameBn: text("product_name_bn"),
    variantName: text("variant_name").notNull(),
    unit: text("unit"),
    image: text("image"),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const orderStatusHistory = pgTable("order_status_history", {
  id: id(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatus("status").notNull(),
  note: text("note"),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

export const couponRedemptions = pgTable("coupon_redemptions", {
  id: id(),
  couponId: uuid("coupon_id")
    .notNull()
    .references(() => coupons.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
});

export const payments = pgTable("payments", {
  id: id(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  provider: paymentMethod("provider").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  status: txnStatus("status").notNull().default("initiated"),
  transactionId: text("transaction_id").unique(),
  validationId: text("validation_id"),
  raw: jsonb("raw"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ─── Engagement ──────────────────────────────────────────────────────────────
export const reviews = pgTable(
  "reviews",
  {
    id: id(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    status: reviewStatus("status").notNull().default("pending"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("reviews_product_user_uq").on(t.productId, t.userId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)],
);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  email: text("email").primaryKey(),
  createdAt: createdAt(),
});

export const contactMessages = pgTable("contact_messages", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  isHandled: boolean("is_handled").notNull().default(false),
  createdAt: createdAt(),
});

// ─── System ──────────────────────────────────────────────────────────────────
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: updatedAt(),
});

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: id(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  data: jsonb("data"),
  createdAt: createdAt(),
});

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Variant = typeof productVariants.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type OrderStatus = (typeof orderStatus.enumValues)[number];
