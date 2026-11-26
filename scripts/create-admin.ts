/**
 * Create or promote a super admin.
 * Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='strong-pass' ADMIN_NAME='Owner' npm run admin:create
 * (In production run with DATABASE_URL pointing at the production database.)
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as s from "../src/lib/db/schema";
import { hashPassword } from "../src/lib/auth/password";

const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "Store Admin";
if (!email || !password || password.length < 10) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (min 10 chars).");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema: s });
const role = await db.query.roles.findFirst({ where: eq(s.roles.name, "Super Admin") });
if (!role) {
  console.error("Run `npm run db:seed` first (roles missing).");
  process.exit(1);
}
const hash = await hashPassword(password);
const existing = await db.query.users.findFirst({ where: eq(s.users.email, email) });
if (existing) {
  await db.update(s.users).set({ role: "staff", staffRoleId: role.id, passwordHash: hash, status: "active" }).where(eq(s.users.id, existing.id));
  console.log(`Updated ${email} → Super Admin`);
} else {
  await db.insert(s.users).values({ name, email, passwordHash: hash, role: "staff", staffRoleId: role.id });
  console.log(`Created Super Admin ${email}`);
}
await pool.end();
