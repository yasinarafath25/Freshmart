import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/auth/guards";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { getSettings } from "@/lib/services/settings";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_NAV } from "@/components/admin/nav";
import { logoutAction } from "@/app/actions/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireStaffPage();
  const settings = await getSettings();
  const links = ADMIN_NAV.filter((l) => hasPermission(user.permissions, l.perm as Permission)).map(({ href, label, icon }) => ({ href, label, icon }));
  return (
    <AdminShell links={links} user={{ name: user.name, roleName: user.roleName }} storeName={settings.storeName} logout={logoutAction}>
      {children}
    </AdminShell>
  );
}
