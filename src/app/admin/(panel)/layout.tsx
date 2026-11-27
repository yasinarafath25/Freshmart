import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db/client";
import { contactMessages, orders, reviews } from "@/lib/db/schema";
import { getSettings } from "@/lib/services/settings";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_NAV } from "@/components/admin/nav";
import { logoutAction } from "@/app/actions/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireStaffPage();
  const db = getDb();
  const can = (p: Permission) => hasPermission(user.permissions, p);
  const [settings, pendingOrders, newMessages, pendingReviews] = await Promise.all([
    getSettings(),
    can("orders:write") ? db.$count(orders, eq(orders.status, "pending")) : 0,
    can("customers:read") ? db.$count(contactMessages, eq(contactMessages.isHandled, false)) : 0,
    can("reviews:write") ? db.$count(reviews, eq(reviews.status, "pending")) : 0,
  ]);
  const badges: Record<string, number> = { "/admin/orders": pendingOrders, "/admin/messages": newMessages, "/admin/reviews": pendingReviews };
  const links = ADMIN_NAV.filter((l) => can(l.perm as Permission)).map(({ href, label, labelBn, icon, group }) => ({ href, label, labelBn, icon, group, badge: badges[href] ?? 0 }));
  return (
    <AdminShell links={links} user={{ name: user.name, roleName: user.roleName }} storeName={settings.storeName} pendingOrders={pendingOrders} logout={logoutAction}>
      {children}
    </AdminShell>
  );
}
