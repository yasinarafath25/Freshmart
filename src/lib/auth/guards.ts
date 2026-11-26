import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "./session";
import { hasPermission, type Permission } from "./permissions";

export class AuthError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "FORBIDDEN") {
    super(code);
  }
}

/** For pages: redirect guests to login. */
export async function requireUserPage(next: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** For pages: staff only; returns null if the staff member lacks the permission (render a 403 state). */
export async function requireStaffPage(permission?: Permission): Promise<{ user: SessionUser; allowed: boolean }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "staff") redirect("/admin/login");
  return { user, allowed: permission ? hasPermission(user.permissions, permission) : true };
}

/** For server actions: throws instead of redirecting. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("UNAUTHENTICATED");
  return user;
}

export async function requireStaff(permission: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "staff") throw new AuthError("UNAUTHENTICATED");
  if (!hasPermission(user.permissions, permission)) throw new AuthError("FORBIDDEN");
  return user;
}
