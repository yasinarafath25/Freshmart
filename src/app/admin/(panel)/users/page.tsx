import { asc, eq } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { roles, users } from "@/lib/db/schema";
import { NoAccess, PageHeader, Table, td } from "@/components/admin/ui";
import { AdminForm } from "@/components/admin/AdminForm";
import { AField, ASelect } from "@/components/admin/fields";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Badge, Card } from "@/components/ui";
import { removeStaffAction, saveStaffUserAction, setUserStatusAction } from "@/app/admin/actions";
import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Staff users" };

export default async function StaffUsersPage() {
  const { user, allowed } = await requireStaffPage("users:write");
  if (!allowed) return <NoAccess />;
  const db = getDb();
  const { t, dateTime } = await getI18n();
  const [staff, roleList] = await Promise.all([
    db.select({ u: users, role: roles.name }).from(users).leftJoin(roles, eq(roles.id, users.staffRoleId)).where(eq(users.role, "staff")).orderBy(asc(users.name)),
    db.select().from(roles).orderBy(asc(roles.name)),
  ]);
  const roleOptions = roleList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>);
  return (
    <>
      <PageHeader title={t("Staff", "স্টাফ")} description={t("People who can sign in to this admin panel. Give each person only the role they need.", "যারা এই অ্যাডমিন প্যানেলে ঢুকতে পারবে। প্রত্যেককে শুধু দরকারি রোল দিন।")} />
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <Table head={[t("Name", "নাম"), t("Role", "রোল"), t("Last sign-in", "শেষ লগইন"), t("Status", "অবস্থা"), ""]}>
          {staff.map(({ u, role }) => (
            <tr key={u.id} className="align-top">
              <td className={td}>
                <p className="font-semibold">{u.name}{u.id === user.id && <span className="ml-1 text-xs text-ink-400">{t("(you)", "(আপনি)")}</span>}</p>
                <p className="text-xs text-ink-400">{u.email}</p>
                <details className="mt-2"><summary className="cursor-pointer text-sm font-semibold text-brand-700">{t("Edit", "এডিট")}</summary>
                  <div className="mt-3 min-w-[320px]">
                    <AdminForm action={saveStaffUserAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="email" value={u.email} />
                      <AField name="name" label={t("Name", "নাম")} defaultValue={u.name} required />
                      <ASelect name="roleId" label={t("Role", "রোল")} defaultValue={u.staffRoleId ?? ""}>{roleOptions}</ASelect>
                      <AField name="password" label={t("New password (optional)", "নতুন পাসওয়ার্ড (ঐচ্ছিক)")} type="password" autoComplete="new-password" hint={t("Leave empty to keep. Signs them out everywhere.", "খালি রাখলে আগেরটাই থাকবে। দিলে সব ডিভাইস থেকে লগ আউট হবে।")} />
                    </AdminForm>
                  </div>
                </details>
              </td>
              <td className={td}><Badge tone="green">{role ?? "—"}</Badge></td>
              <td className={td}>{u.lastLoginAt ? dateTime(u.lastLoginAt) : t("Never", "কখনো না")}</td>
              <td className={td}>{u.status === "active" ? <Badge tone="green">{t("Active", "সক্রিয়")}</Badge> : <Badge tone="red">{t("Blocked", "ব্লক করা")}</Badge>}</td>
              <td className={`${td} whitespace-nowrap text-right`}>
                {u.id !== user.id && (
                  <>
                    <form action={setUserStatusAction} className="mr-3 inline">
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="status" value={u.status === "active" ? "blocked" : "active"} />
                      <button className="font-semibold text-ink-600 hover:text-ink-900">{u.status === "active" ? t("Block", "ব্লক") : t("Unblock", "আনব্লক")}</button>
                    </form>
                    <form action={removeStaffAction} className="inline"><input type="hidden" name="id" value={u.id} /><ConfirmButton message={t(`Remove admin access for ${u.name}? Their account becomes a regular customer account.`, `${u.name}-এর অ্যাডমিন অনুমতি সরাবেন? তার অ্যাকাউন্ট সাধারণ গ্রাহক অ্যাকাউন্ট হয়ে যাবে।`)}>{t("Remove access", "অনুমতি সরান")}</ConfirmButton></form>
                  </>
                )}
              </td>
            </tr>
          ))}
        </Table>
        <Card className="h-fit p-6">
          <h2 className="mb-1 font-semibold">{t("Add staff member", "নতুন স্টাফ যোগ করুন")}</h2>
          <p className="mb-4 text-sm text-ink-600">{t("If the email already has a customer account, it is upgraded and keeps its password.", "এই ইমেইলে আগে থেকে গ্রাহক অ্যাকাউন্ট থাকলে সেটাই স্টাফ হয়ে যাবে, পাসওয়ার্ড একই থাকবে।")}</p>
          <AdminForm action={saveStaffUserAction} submitLabel={t("Add staff", "স্টাফ যোগ করুন")} resetOnSuccess>
            <AField name="name" label={t("Name", "নাম")} required />
            <AField name="email" label={t("Email", "ইমেইল")} type="email" required />
            <ASelect name="roleId" label={t("Role", "রোল")} defaultValue={roleList.find((r) => r.name === "Staff")?.id}>{roleOptions}</ASelect>
            <AField name="password" label={t("Password", "পাসওয়ার্ড")} type="password" autoComplete="new-password" hint={t("At least 8 characters with a letter and a number. Share it privately.", "কমপক্ষে ৮ অক্ষর, অন্তত একটি অক্ষর ও একটি সংখ্যা। গোপনে জানিয়ে দিন।")} />
          </AdminForm>
        </Card>
      </div>
    </>
  );
}
