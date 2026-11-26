import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { roles, sessions, users } from "@/lib/db/schema";
import { randomToken, sha256 } from "@/lib/utils/crypto";

export const SESSION_COOKIE = "fm_session";
const DAY = 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "customer" | "staff";
  permissions: string[];
  roleName: string | null;
};

export async function createSession(userId: string, remember: boolean) {
  const db = getDb();
  const token = randomToken(32);
  const lifetime = remember ? 30 * DAY : DAY;
  const expiresAt = new Date(Date.now() + lifetime);
  const h = await headers();
  await db.insert(sessions).values({
    id: await sha256(token),
    userId,
    expiresAt,
    userAgent: h.get("user-agent")?.slice(0, 250) ?? null,
    ip: h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? null,
  });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb().delete(sessions).where(eq(sessions.id, await sha256(token)));
  }
  jar.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string) {
  await getDb().delete(sessions).where(eq(sessions.userId, userId));
}

/** Current user for this request (memoised per request). Blocked users are treated as signed out. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const db = getDb();
  const id = await sha256(token);
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      status: users.status,
      permissions: roles.permissions,
      roleName: roles.name,
      expiresAt: sessions.expiresAt,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .leftJoin(roles, eq(roles.id, users.staffRoleId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const r = rows[0];
  if (!r || r.status !== "active") return null;

  // Sliding renewal: extend when less than half of the lifetime remains.
  const lifetime = r.expiresAt.getTime() - r.createdAt.getTime();
  if (r.expiresAt.getTime() - Date.now() < lifetime / 2) {
    const newExpiry = new Date(Date.now() + lifetime);
    await db.update(sessions).set({ expiresAt: newExpiry }).where(eq(sessions.id, id));
    try {
      jar.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: newExpiry,
      });
    } catch {
      /* cookies are read-only during Server Component render; renewal is persisted in DB anyway */
    }
  }

  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    permissions: r.role === "staff" ? (r.permissions ?? []) : [],
    roleName: r.roleName,
  };
});
