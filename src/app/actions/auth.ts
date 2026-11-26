"use server";

import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyAllSessions, destroySession } from "@/lib/auth/session";
import { mergeGuestCart } from "@/lib/services/cart";
import { sendEmail } from "@/lib/services/email";
import { getSettings } from "@/lib/services/settings";
import { clientIp, rateLimit } from "@/lib/utils/rate-limit";
import { randomToken, sha256 } from "@/lib/utils/crypto";
import { email as emailSchema, fieldErrors, loginSchema, password as passwordSchema, registerSchema } from "@/lib/validation/schemas";

export type AuthState = { message?: string; errors?: Record<string, string>; ok?: boolean; values?: Record<string, string> } | null;

/** Only allow same-site relative redirects. */
function safeNext(v: FormDataEntryValue | null, fallback: string): string {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : fallback;
}

// A valid hash to compare against when the email doesn't exist (keeps timing similar).
let dummyHash: string | null = null;

async function authenticate(formData: FormData, staffOnly: boolean): Promise<AuthState | { userId: string; role: string; remember: boolean }> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { email: String(formData.get("email") ?? "") } };
  const ip = await clientIp();
  if (!(await rateLimit(`login:${ip}:${parsed.data.email}`, 5, 15 * 60)) || !(await rateLimit(`login-ip:${ip}`, 30, 15 * 60))) {
    return { message: "Too many sign-in attempts. Please wait 15 minutes and try again.", values: { email: parsed.data.email } };
  }
  const user = await getDb().query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  dummyHash ??= await hashPassword("timing-equaliser-0");
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? dummyHash);
  if (!user || !valid) return { message: "Incorrect email or password.", values: { email: parsed.data.email } };
  if (user.status === "blocked") return { message: "This account has been suspended. Please contact support.", values: { email: parsed.data.email } };
  if (staffOnly && user.role !== "staff") return { message: "This account does not have admin access.", values: { email: parsed.data.email } };
  return { userId: user.id, role: user.role, remember: parsed.data.remember === "on" };
}

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const res = await authenticate(formData, false);
  if (!res || !("userId" in res)) return res;
  await createSession(res.userId, res.remember);
  await mergeGuestCart(res.userId);
  redirect(safeNext(formData.get("next"), res.role === "staff" ? "/admin/dashboard" : "/account"));
}

export async function adminLoginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const res = await authenticate(formData, true);
  if (!res || !("userId" in res)) return res;
  await createSession(res.userId, res.remember);
  redirect(safeNext(formData.get("next"), "/admin/dashboard"));
}

export async function registerAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = { name: raw.name ?? "", email: raw.email ?? "", phone: raw.phone ?? "" };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  if (raw.terms !== "on") return { errors: { terms: "Please accept the terms to continue." }, values };
  if (!(await rateLimit(`register:${await clientIp()}`, 5, 3600))) return { message: "Too many sign-ups from this network. Please try later.", values };

  const db = getDb();
  const exists = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  if (exists) return { errors: { email: "An account with this email already exists. Try signing in." }, values };
  const [u] = await db
    .insert(users)
    .values({ name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone ?? null, passwordHash: await hashPassword(parsed.data.password) })
    .returning({ id: users.id });
  await createSession(u.id, true);
  await mergeGuestCart(u.id);
  redirect(safeNext(formData.get("next"), "/account"));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function requestPasswordResetAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { errors: { email: parsed.error.issues[0].message } };
  if (!(await rateLimit(`reset:${await clientIp()}`, 5, 3600))) return { message: "Too many requests. Please try later." };
  const db = getDb();
  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data) });
  if (user && user.status === "active") {
    const token = randomToken(32);
    await db.insert(passwordResetTokens).values({ id: await sha256(token), userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
    const s = await getSettings();
    const link = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    await sendEmail(
      user.email,
      `Reset your ${s.storeName} password`,
      `Hi ${user.name},\n\nUse this link to set a new password (valid for 60 minutes):\n${link}\n\nIf you didn't request this, you can ignore this email.`,
    );
  }
  // Same response whether or not the account exists (no account enumeration).
  return { ok: true, message: "If an account exists for that email, we’ve sent a reset link. It expires in 60 minutes." };
}

export async function resetPasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const token = z.string().min(20).max(100).safeParse(formData.get("token"));
  const pw = passwordSchema.safeParse(formData.get("password"));
  if (!token.success) return { message: "This reset link is invalid." };
  if (!pw.success) return { errors: { password: pw.error.issues[0].message } };
  if (formData.get("password") !== formData.get("confirm")) return { errors: { confirm: "Passwords don’t match." } };
  const db = getDb();
  const id = await sha256(token.data);
  const row = await db.query.passwordResetTokens.findFirst({
    where: and(eq(passwordResetTokens.id, id), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date())),
  });
  if (!row) return { message: "This reset link has expired or was already used. Please request a new one." };
  await db.update(users).set({ passwordHash: await hashPassword(pw.data) }).where(eq(users.id, row.userId));
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id));
  await destroyAllSessions(row.userId);
  redirect("/login?reset=1");
}
