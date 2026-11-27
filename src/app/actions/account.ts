"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifyOrderCancelled } from "@/lib/services/telegram";
import { and, eq, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { addresses, notifications, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyAllSessions } from "@/lib/auth/session";
import { addressSchema, fieldErrors, optionalPhone, password as passwordSchema } from "@/lib/validation/schemas";
import { cancelOrder, CheckoutError } from "@/lib/services/orders";

export type AccountState = { ok?: boolean; message?: string; errors?: Record<string, string> } | null;

export async function updateProfileAction(_: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser();
  const parsed = z
    .object({ name: z.string().trim().min(2, "Please enter your name.").max(80), phone: optionalPhone })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await getDb().update(users).set({ name: parsed.data.name, phone: parsed.data.phone ?? null }).where(eq(users.id, user.id));
  revalidatePath("/account", "layout");
  return { ok: true, message: "Profile updated." };
}

export async function changePasswordAction(_: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = passwordSchema.safeParse(formData.get("password"));
  if (!next.success) return { errors: { password: next.error.issues[0].message } };
  if (formData.get("password") !== formData.get("confirm")) return { errors: { confirm: "Passwords don’t match." } };
  const db = getDb();
  const row = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  if (!row || !(await verifyPassword(current, row.passwordHash))) return { errors: { current: "Current password is incorrect." } };
  await db.update(users).set({ passwordHash: await hashPassword(next.data) }).where(eq(users.id, user.id));
  // Sign out other devices, keep this one signed in.
  await destroyAllSessions(user.id);
  await createSession(user.id, true);
  return { ok: true, message: "Password changed. Other devices have been signed out." };
}

export async function saveAddressAction(_: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser();
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const id = z.string().uuid().safeParse(formData.get("id"));
  const makeDefault = formData.get("isDefault") === "on";
  const db = getDb();
  const data = { ...parsed.data, line2: parsed.data.line2 || null, postalCode: parsed.data.postalCode || null };
  const count = await db.$count(addresses, eq(addresses.userId, user.id));
  let addressId: string;
  if (id.success) {
    const res = await db.update(addresses).set(data).where(and(eq(addresses.id, id.data), eq(addresses.userId, user.id))).returning({ id: addresses.id });
    if (!res[0]) return { message: "Address not found." };
    addressId = res[0].id;
  } else {
    if (count >= 10) return { message: "You can save up to 10 addresses." };
    const [row] = await db.insert(addresses).values({ ...data, userId: user.id }).returning({ id: addresses.id });
    addressId = row.id;
  }
  if (makeDefault || count === 0) {
    await db.update(addresses).set({ isDefault: false }).where(and(eq(addresses.userId, user.id), ne(addresses.id, addressId)));
    await db.update(addresses).set({ isDefault: true }).where(eq(addresses.id, addressId));
  }
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true, message: "Address saved." };
}

export async function deleteAddressAction(formData: FormData) {
  const user = await requireUser();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  await getDb().delete(addresses).where(and(eq(addresses.id, id.data), eq(addresses.userId, user.id)));
  revalidatePath("/account/addresses");
}

export async function setDefaultAddressAction(formData: FormData) {
  const user = await requireUser();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const db = getDb();
  const owned = await db.query.addresses.findFirst({ where: and(eq(addresses.id, id.data), eq(addresses.userId, user.id)) });
  if (!owned) return;
  await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
  await db.update(addresses).set({ isDefault: true }).where(eq(addresses.id, id.data));
  revalidatePath("/account/addresses");
}

export async function cancelMyOrderAction(_: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser();
  const id = z.string().uuid().safeParse(formData.get("orderId"));
  const reason = z.string().trim().max(200).safeParse(formData.get("reason") ?? "");
  if (!id.success) return { message: "Invalid order." };
  try {
    await cancelOrder({ orderId: id.data, actorId: user.id, reason: reason.success ? reason.data : "", asCustomer: true });
  } catch (e) {
    if (e instanceof CheckoutError) return { message: e.message };
    throw e;
  }
  revalidatePath(`/account/orders/${id.data}`);
  revalidatePath("/account/orders");
  const orderId = id.data;
  const why = reason.success ? reason.data : "";
  after(() => notifyOrderCancelled(orderId, why));
  return { ok: true, message: "Your order has been cancelled." };
}

export async function markNotificationsReadAction() {
  const user = await requireUser();
  await getDb().update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  revalidatePath("/account", "layout");
}
