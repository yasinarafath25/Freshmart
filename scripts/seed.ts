/**
 * Seeds roles, settings, delivery zones, categories, a STARTER catalog and the first super admin.
 * Prices and illustrations are placeholders: the owner must review prices and upload real photos before launch.
 * Safe to re-run: rows are upserted by unique keys; existing products are not overwritten.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { Pool } from "pg";
import * as s from "../src/lib/db/schema";
import { hashPassword } from "../src/lib/auth/password";
import { CATEGORY_BN, PRODUCT_BN, SETTINGS_BN, ZONE_BN } from "./seed-bn";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema: s });

const ROLES = [
  { name: "Super Admin", description: "Full access", permissions: ["*"], isSystem: true },
  {
    name: "Manager",
    description: "Runs catalog, orders, promotions and reports",
    permissions: [
      "dashboard:read", "products:write", "inventory:write", "orders:write", "customers:read", "customers:write",
      "coupons:write", "delivery:write", "payments:read", "reviews:write", "reports:read",
    ],
  },
  {
    name: "Staff",
    description: "Fulfils orders and updates stock",
    permissions: ["dashboard:read", "inventory:write", "orders:write", "customers:read", "reviews:write"],
  },
  {
    // For a public portfolio demo login: can try the shop tools, but can't see customers or change settings, staff or roles.
    name: "Demo",
    description: "Portfolio demo — no customers, settings, staff or roles",
    permissions: [
      "dashboard:read", "products:write", "inventory:write", "orders:write", "coupons:write", "delivery:write", "payments:read", "reviews:write", "reports:read",
    ],
  },
];

const CATEGORIES = [
  { slug: "fruits", name: "Fruits", image: "/images/photos/red-apple.jpg", description: "Sweet, juicy fruits picked at peak ripeness." },
  { slug: "vegetables", name: "Vegetables", image: "/images/photos/cauliflower.jpg", description: "Farm-fresh everyday vegetables." },
  { slug: "leafy-greens", name: "Leafy Greens", image: "/images/photos/spinach.jpg", description: "Tender greens, harvested daily.", parent: "vegetables" },
  { slug: "roots-onions", name: "Potatoes & Onions", image: "/images/photos/potato.jpg", description: "Kitchen staples: potatoes, onions, garlic and ginger.", parent: "vegetables" },
  { slug: "groceries", name: "Groceries", image: "/images/photos/wheat-flour-atta.jpg", description: "Daily essentials for your pantry." },
  { slug: "grains", name: "Grains & Pulses", image: "/images/photos/lentils-masoor-dal.jpg", description: "Rice, dal and pulses.", parent: "groceries" },
  { slug: "spices", name: "Spices & Herbs", image: "/images/photos/turmeric-powder.jpg", description: "Whole and ground spices for authentic flavour." },
];

type V = { name: string; price: number; compare?: number; stock: number };
type P = { name: string; cat: string; unit: s.Product["unit"]; img: string; photo?: string; desc: string; v: V[]; organic?: boolean; featured?: boolean; seasonal?: boolean; origin?: string; fresh?: string };
const PRODUCTS: P[] = [
  { name: "Red Apple", cat: "fruits", unit: "kg", img: "red-apple", photo: "red-apple", desc: "Crisp, sweet red apples with a juicy bite. Great for snacking and salads.", v: [{ name: "1 kg", price: 120, compare: 140, stock: 60 }, { name: "500 g", price: 65, stock: 40 }], featured: true, origin: "Himachal", fresh: "Fresh" },
  { name: "Green Apple", cat: "fruits", unit: "kg", img: "green-apple", photo: "green-apple", desc: "Tart and refreshing green apples.", v: [{ name: "1 kg", price: 160, stock: 30 }], origin: "Imported", fresh: "Fresh" },
  { name: "Orange", cat: "fruits", unit: "kg", img: "orange", photo: "orange", desc: "Juicy oranges packed with vitamin C.", v: [{ name: "1 kg", price: 100, stock: 50 }], featured: true, seasonal: true, fresh: "Fresh" },
  { name: "Banana", cat: "fruits", unit: "dozen", img: "banana", photo: "banana", desc: "Naturally ripened bananas — energy in every bite.", v: [{ name: "1 dozen", price: 60, stock: 80 }, { name: "Half dozen", price: 32, stock: 40 }], featured: true, fresh: "Fresh" },
  { name: "Mango (Himsagar)", cat: "fruits", unit: "kg", img: "mango", photo: "mango", desc: "Fragrant, fibre-less seasonal mangoes.", v: [{ name: "1 kg", price: 150, compare: 180, stock: 25 }], seasonal: true, fresh: "Seasonal" },
  { name: "Black Grapes", cat: "fruits", unit: "kg", img: "grapes", photo: "grapes", desc: "Sweet seedless black grapes.", v: [{ name: "500 g", price: 90, stock: 30 }], fresh: "Fresh" },
  { name: "Watermelon", cat: "fruits", unit: "piece", img: "watermelon", photo: "watermelon", desc: "Refreshing summer watermelon (approx. 3–4 kg).", v: [{ name: "1 piece", price: 180, stock: 12 }], seasonal: true, fresh: "Seasonal" },
  { name: "Lemon", cat: "fruits", unit: "piece", img: "lemon", photo: "lemon", desc: "Zesty lemons for drinks and cooking.", v: [{ name: "4 pieces", price: 30, stock: 70 }], fresh: "Fresh" },
  { name: "Tomato", cat: "vegetables", unit: "kg", img: "tomato", photo: "tomato", desc: "Ripe red tomatoes for curries and salads.", v: [{ name: "1 kg", price: 40, stock: 100 }, { name: "500 g", price: 22, stock: 60 }], featured: true, fresh: "Fresh" },
  { name: "Organic Tomato", cat: "vegetables", unit: "kg", img: "tomato", photo: "tomato", desc: "Pesticide-free tomatoes from certified organic farms.", v: [{ name: "1 kg", price: 70, stock: 30 }], organic: true, fresh: "Organic" },
  { name: "Carrot", cat: "vegetables", unit: "kg", img: "carrot", photo: "carrot", desc: "Crunchy sweet carrots.", v: [{ name: "1 kg", price: 60, compare: 70, stock: 50 }], fresh: "Fresh" },
  { name: "Organic Carrot", cat: "vegetables", unit: "kg", img: "carrot", photo: "carrot", desc: "Organically grown carrots.", v: [{ name: "500 g", price: 55, stock: 20 }], organic: true, fresh: "Organic" },
  { name: "Broccoli", cat: "vegetables", unit: "piece", img: "broccoli", photo: "broccoli", desc: "Fresh green broccoli heads.", v: [{ name: "1 piece (~400 g)", price: 80, stock: 25 }], organic: true, fresh: "Organic" },
  { name: "Cauliflower", cat: "vegetables", unit: "piece", img: "cauliflower", photo: "cauliflower", desc: "Firm white cauliflower.", v: [{ name: "1 piece", price: 45, stock: 30 }], seasonal: true, fresh: "Fresh" },
  { name: "Cucumber", cat: "vegetables", unit: "kg", img: "cucumber", photo: "cucumber", desc: "Cool, crisp cucumbers.", v: [{ name: "1 kg", price: 50, stock: 40 }], organic: true, fresh: "Organic" },
  { name: "Brinjal (Eggplant)", cat: "vegetables", unit: "kg", img: "eggplant", photo: "eggplant", desc: "Glossy purple brinjal.", v: [{ name: "1 kg", price: 50, stock: 35 }], fresh: "Fresh" },
  { name: "Pumpkin", cat: "vegetables", unit: "kg", img: "pumpkin", photo: "pumpkin", desc: "Sweet pumpkin, cut to order.", v: [{ name: "1 kg", price: 35, stock: 40 }], seasonal: true, fresh: "Seasonal" },
  { name: "Green Chili", cat: "vegetables", unit: "g", img: "chili", photo: "green-chili", desc: "Hot green chilies.", v: [{ name: "250 g", price: 25, stock: 60 }], fresh: "Fresh" },
  { name: "Spinach", cat: "leafy-greens", unit: "bunch", img: "spinach", photo: "spinach", desc: "Tender spinach leaves, washed and bundled.", v: [{ name: "1 bunch", price: 20, stock: 50 }], organic: true, fresh: "Organic" },
  { name: "Red Amaranth (Lal Shak)", cat: "leafy-greens", unit: "bunch", img: "spinach", photo: "lal-shak", desc: "Nutritious red amaranth greens.", v: [{ name: "1 bunch", price: 20, stock: 40 }], fresh: "Fresh" },
  { name: "Potato", cat: "roots-onions", unit: "kg", img: "potato", photo: "potato", desc: "All-purpose potatoes.", v: [{ name: "1 kg", price: 30, stock: 200 }, { name: "5 kg", price: 140, compare: 150, stock: 40 }], featured: true, fresh: "Fresh" },
  { name: "Onion", cat: "roots-onions", unit: "kg", img: "onion", photo: "onion", desc: "Red onions with strong flavour.", v: [{ name: "1 kg", price: 55, stock: 150 }, { name: "5 kg", price: 260, compare: 275, stock: 30 }], featured: true, fresh: "Fresh" },
  { name: "Garlic", cat: "roots-onions", unit: "g", img: "garlic", photo: "garlic", desc: "Aromatic garlic bulbs.", v: [{ name: "250 g", price: 60, stock: 60 }], fresh: "Fresh" },
  { name: "Ginger", cat: "roots-onions", unit: "g", img: "ginger", photo: "ginger", desc: "Fresh ginger root.", v: [{ name: "250 g", price: 50, stock: 50 }], fresh: "Fresh" },
  { name: "Miniket Rice", cat: "grains", unit: "kg", img: "rice", photo: "rice", desc: "Fine, polished miniket rice.", v: [{ name: "5 kg", price: 380, compare: 400, stock: 40 }, { name: "1 kg", price: 78, stock: 80 }] },
  { name: "Masoor Dal", cat: "grains", unit: "kg", img: "lentils", photo: "lentils-masoor-dal", desc: "Red lentils — quick cooking and protein rich.", v: [{ name: "1 kg", price: 120, stock: 60 }] },
  { name: "Chickpeas (Kabuli Chana)", cat: "grains", unit: "kg", img: "chickpeas", photo: "chickpeas", desc: "Premium white chickpeas.", v: [{ name: "1 kg", price: 140, stock: 40 }] },
  { name: "Atta (Whole Wheat Flour)", cat: "groceries", unit: "pack", img: "flour", photo: "wheat-flour-atta", desc: "Stone-ground whole wheat flour.", v: [{ name: "2 kg pack", price: 110, stock: 50 }] },
  { name: "Sugar", cat: "groceries", unit: "kg", img: "sugar", photo: "sugar", desc: "Refined white sugar.", v: [{ name: "1 kg", price: 48, stock: 80 }] },
  { name: "Mustard Oil", cat: "groceries", unit: "litre", img: "mustard-oil", photo: "mustard-oil", desc: "Cold-pressed kachi ghani mustard oil.", v: [{ name: "1 litre", price: 190, compare: 210, stock: 40 }] },
  { name: "Pure Honey", cat: "groceries", unit: "g", img: "honey", photo: "honey", desc: "Natural forest honey.", v: [{ name: "500 g", price: 320, stock: 20 }], organic: true, fresh: "Organic" },
  { name: "Farm Eggs", cat: "groceries", unit: "dozen", img: "eggs", photo: "eggs", desc: "Fresh farm eggs.", v: [{ name: "1 dozen", price: 84, stock: 40 }], fresh: "Fresh" },
  { name: "Turmeric Powder", cat: "spices", unit: "g", img: "turmeric", photo: "turmeric-powder", desc: "Pure ground turmeric.", v: [{ name: "200 g", price: 60, stock: 50 }] },
  { name: "Red Chili Powder", cat: "spices", unit: "g", img: "chili-powder", photo: "chili-powder", desc: "Hot red chili powder.", v: [{ name: "200 g", price: 70, stock: 50 }] },
  { name: "Cumin Seeds", cat: "spices", unit: "g", img: "cumin", photo: "cumin-seeds", desc: "Whole cumin (jeera) seeds.", v: [{ name: "100 g", price: 55, stock: 50 }] },
  // ── Added from the owner's photo library (website-images/). Prices are placeholders. ──
  { name: "Malabar Spinach (Pui Shak)", cat: "leafy-greens", unit: "bunch", img: "spinach", photo: "pui-shak", desc: "Tender pui shak, great with fish or in a light stir-fry.", v: [{ name: "1 bunch", price: 25, stock: 40 }], fresh: "Fresh" },
  { name: "Water Spinach (Kolmi Shak)", cat: "leafy-greens", unit: "bunch", img: "spinach", photo: "kolmi-shak", desc: "Crisp kolmi shak, harvested daily.", v: [{ name: "1 bunch", price: 20, stock: 40 }], fresh: "Fresh" },
  { name: "Coriander Leaves (Dhonepata)", cat: "leafy-greens", unit: "bunch", img: "spinach", photo: "coriander-leaves", desc: "Fragrant fresh coriander for garnishing.", v: [{ name: "100 g", price: 15, stock: 60 }], fresh: "Fresh" },
  { name: "Mint Leaves (Pudina)", cat: "leafy-greens", unit: "bunch", img: "spinach", photo: "mint-leaves-pudina", desc: "Cool, aromatic mint leaves for chutneys and drinks.", v: [{ name: "1 bunch", price: 15, stock: 40 }], fresh: "Fresh" },
  { name: "Pointed Gourd (Potol)", cat: "vegetables", unit: "kg", img: "cucumber", photo: "pointed-gourd-potol", desc: "Fresh potol for curries and bhaja.", v: [{ name: "1 kg", price: 60, stock: 40 }, { name: "500 g", price: 32, stock: 30 }], fresh: "Fresh", featured: true },
  { name: "Okra (Dherosh)", cat: "vegetables", unit: "kg", img: "cucumber", photo: "okra-dherosh", desc: "Tender lady finger, picked young.", v: [{ name: "500 g", price: 35, stock: 50 }], fresh: "Fresh" },
  { name: "Bitter Gourd (Korola)", cat: "vegetables", unit: "kg", img: "cucumber", photo: "bitter-gourd-korola", desc: "Fresh korola — healthy and full of flavour.", v: [{ name: "500 g", price: 40, stock: 35 }], fresh: "Fresh" },
  { name: "Bottle Gourd (Lau)", cat: "vegetables", unit: "piece", img: "cucumber", photo: "bottle-gourd-lau", desc: "Soft, fresh lau for light curries.", v: [{ name: "1 piece", price: 50, stock: 25 }], fresh: "Fresh" },
  { name: "Ash Gourd (Chal Kumra)", cat: "vegetables", unit: "kg", img: "pumpkin", photo: "ash-gourd-chalkumra", desc: "Ash gourd, cut to order.", v: [{ name: "1 kg", price: 35, stock: 20 }], fresh: "Fresh" },
  { name: "Ridge Gourd (Jhinge)", cat: "vegetables", unit: "kg", img: "cucumber", photo: "ridge-gourd-jhinge", desc: "Fresh jhinge for everyday cooking.", v: [{ name: "500 g", price: 30, stock: 30 }], fresh: "Fresh" },
  { name: "Snake Gourd (Chichinga)", cat: "vegetables", unit: "kg", img: "cucumber", photo: "snake-gourd-chichinga", desc: "Long, tender chichinga.", v: [{ name: "500 g", price: 30, stock: 30 }], fresh: "Fresh" },
  { name: "Spiny Gourd (Kakrol)", cat: "vegetables", unit: "kg", img: "cucumber", photo: "teasel-gourd-kakrol", desc: "Seasonal kakrol, perfect for bhaja.", v: [{ name: "500 g", price: 45, stock: 25 }], fresh: "Seasonal", seasonal: true },
  { name: "Flat Beans (Deshi Shim)", cat: "vegetables", unit: "kg", img: "cucumber", photo: "flat-beans-shim", desc: "Fresh deshi shim — a winter favourite.", v: [{ name: "500 g", price: 40, stock: 30 }], fresh: "Seasonal", seasonal: true },
  { name: "Yardlong Beans (Borboti)", cat: "vegetables", unit: "kg", img: "cucumber", photo: "yardlong-beans-borboti", desc: "Crunchy borboti beans.", v: [{ name: "500 g", price: 35, stock: 30 }], fresh: "Fresh" },
  { name: "Cabbage (Bandhakopi)", cat: "vegetables", unit: "piece", img: "cauliflower", photo: "cabbage", desc: "Firm, fresh cabbage heads.", v: [{ name: "1 piece", price: 40, stock: 30 }], fresh: "Fresh", seasonal: true },
  { name: "White Radish (Mula)", cat: "roots-onions", unit: "kg", img: "carrot", photo: "radish-mula", desc: "Crisp white radish.", v: [{ name: "1 kg", price: 30, stock: 30 }], fresh: "Fresh" },
  { name: "Green Papaya (Kancha Pepe)", cat: "vegetables", unit: "kg", img: "cucumber", photo: "green-papaya", desc: "Raw papaya for curries and salads.", v: [{ name: "1 kg", price: 40, stock: 20 }], fresh: "Fresh" },
  { name: "Raw Banana (Kanchkola)", cat: "vegetables", unit: "dozen", img: "banana", photo: "raw-banana-kanchkola", desc: "Green cooking bananas for bhorta and curry.", v: [{ name: "4 pieces", price: 30, stock: 30 }], fresh: "Fresh" },
  { name: "Taro Root (Mukhi Kochu)", cat: "roots-onions", unit: "kg", img: "potato", photo: "taro-root-kochu", desc: "Fresh mukhi kochu.", v: [{ name: "1 kg", price: 50, stock: 25 }], fresh: "Fresh" },
  { name: "Capsicum (Bell Pepper)", cat: "vegetables", unit: "kg", img: "chili", photo: "capsicum", desc: "Crunchy green capsicum.", v: [{ name: "250 g", price: 40, stock: 30 }], fresh: "Fresh" },
];

const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  for (const r of ROLES) {
    await db.insert(s.roles).values(r).onConflictDoNothing({ target: s.roles.name });
  }

  await db.insert(s.settings).values({ key: "store", value: {} }).onConflictDoNothing();

  const zoneCount = await db.$count(s.deliveryZones);
  if (zoneCount === 0) {
    await db.insert(s.deliveryZones).values([
      { name: "Karimganj Town", fee: 3000, freeAbove: 99900, etaText: "Same day (order before 2 PM)", sortOrder: 1 },
      { name: "Badarpur", fee: 5000, freeAbove: 99900, etaText: "Next day", sortOrder: 2 },
      { name: "Nilambazar", fee: 6000, freeAbove: 149900, etaText: "Next day", sortOrder: 3 },
      { name: "Patharkandi", fee: 7000, freeAbove: 149900, etaText: "1–2 days", sortOrder: 4 },
    ]);
  }

  const catIds = new Map<string, string>();
  let i = 0;
  for (const c of CATEGORIES) {
    const [row] = await db
      .insert(s.categories)
      .values({ slug: c.slug, name: c.name, image: c.image, description: c.description, sortOrder: i++, parentId: c.parent ? catIds.get(c.parent) : null })
      .onConflictDoUpdate({
        target: s.categories.slug,
        set: { name: c.name, image: sql`case when ${s.categories.image} like '/images/products/%' then ${c.image} else ${s.categories.image} end` },
      })
      .returning();
    catIds.set(c.slug, row.id);
  }

  let created = 0;
  let photosApplied = 0;
  for (const p of PRODUCTS) {
    const pslug = slug(p.name);
    const images = p.photo ? [`/images/photos/${p.photo}.jpg`] : [`/images/products/${p.img}.svg`];
    const exists = await db.query.products.findFirst({ where: eq(s.products.slug, pslug) });
    if (exists) {
      // Replace seed placeholder art with the real photo, but never overwrite images an admin has changed.
      const placeholder = exists.images.length === 1 && exists.images[0] === `/images/products/${p.img}.svg`;
      if (placeholder && p.photo) {
        await db.update(s.products).set({ images }).where(eq(s.products.id, exists.id));
        photosApplied++;
      }
      continue;
    }
    const [prod] = await db
      .insert(s.products)
      .values({
        name: p.name,
        slug: pslug,
        description: p.desc,
        categoryId: catIds.get(p.cat)!,
        unit: p.unit,
        images,
        isOrganic: !!p.organic,
        isFeatured: !!p.featured,
        isSeasonal: !!p.seasonal,
        origin: p.origin ?? "Local farms",
        freshnessLabel: p.fresh ?? null,
      })
      .returning();
    await db.insert(s.productVariants).values(
      p.v.map((v, idx) => ({
        productId: prod.id,
        name: v.name,
        sku: `${pslug.slice(0, 18).toUpperCase()}-${idx + 1}`,
        price: v.price * 100,
        compareAtPrice: v.compare ? v.compare * 100 : null,
        stock: v.stock,
        isDefault: idx === 0,
        sortOrder: idx,
      })),
    );
    created++;
  }

  const couponCount = await db.$count(s.coupons);
  if (couponCount === 0) {
    await db.insert(s.coupons).values([
      { code: "FRESH20", description: "20% off fresh produce (max ৳200)", type: "percent", value: 20, minOrder: 50000, maxDiscount: 20000, perUserLimit: 3, isPublic: true },
      { code: "WELCOME50", description: "৳50 off your first order", type: "fixed", value: 5000, minOrder: 30000, perUserLimit: 1, isPublic: true },
      { code: "FREEDEL", description: "Free delivery on orders over ৳500", type: "free_delivery", value: 0, minOrder: 50000, perUserLimit: 5, isPublic: true },
    ]);
  }

  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const role = await db.query.roles.findFirst({ where: eq(s.roles.name, "Super Admin") });
    const existing = await db.query.users.findFirst({ where: eq(s.users.email, email) });
    if (!existing) {
      await db.insert(s.users).values({ name: "Store Admin", email, passwordHash: await hashPassword(password), role: "staff", staffRoleId: role!.id });
      console.log(`Created super admin ${email}`);
    }
  } else {
    console.log("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin user. Use `npm run admin:create`.");
  }
  // Bangla translations — fill only empty fields so admin edits are kept.
  let bnFilled = 0;
  for (const [slug, v] of Object.entries(CATEGORY_BN)) {
    const r = await db.update(s.categories).set({ nameBn: sql`coalesce(${s.categories.nameBn}, ${v.name})`, descriptionBn: sql`coalesce(${s.categories.descriptionBn}, ${v.description})` }).where(eq(s.categories.slug, slug)).returning({ id: s.categories.id });
    bnFilled += r.length;
  }
  for (const [name, v] of Object.entries(ZONE_BN)) {
    await db.update(s.deliveryZones).set({ nameBn: sql`coalesce(${s.deliveryZones.nameBn}, ${v.name})`, etaTextBn: sql`coalesce(${s.deliveryZones.etaTextBn}, ${v.eta})` }).where(eq(s.deliveryZones.name, name));
  }
  for (const [name, v] of Object.entries(PRODUCT_BN)) {
    const r = await db.update(s.products).set({ nameBn: sql`coalesce(${s.products.nameBn}, ${v.name})`, descriptionBn: sql`coalesce(${s.products.descriptionBn}, ${v.description})` }).where(eq(s.products.name, name)).returning({ id: s.products.id });
    bnFilled += r.length;
  }
  const storeRow = await db.query.settings.findFirst({ where: eq(s.settings.key, "store") });
  const store = (storeRow?.value ?? {}) as Record<string, unknown>;
  if (!store.taglineBn || !store.announcementsBn) {
    await db.update(s.settings).set({ value: { ...SETTINGS_BN, ...store } }).where(eq(s.settings.key, "store"));
  }
  console.log(`Bangla text filled for ${bnFilled} categories/products`);

  console.log(`Seed complete. Products created: ${created}, photos applied to existing: ${photosApplied}`);
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
