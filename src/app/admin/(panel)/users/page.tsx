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

export const metadata = { title: "Staff users" };

export default async function StaffUsersPage() {
  const { user, allowed } = await requireStaffPage("users:write");
  if (!allowed) return <NoAccess />;
  const db = getDb();
  const [staff, roleList] = await Promise.all([
    db.select({ u: users, role: roles.name }).from(users).leftJoin(roles, eq(roles.id, users.staffRoleId)).where(eq(users.role, "staff")).orderBy(asc(users.name)),
    db.select().from(roles).orderBy(asc(roles.name)),
  ]);
  const roleOptions = roleList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>);
  return (
    <>
      <PageHeader title="Staff users" description="People who can sign in to this admin panel." />
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <Table head={["Name", "Role", "Last sign-in", "Status", ""]}>
          {staff.map(({ u, role }) => (
            <tr key={u.id} className="align-top">
              <td className={td}>
                <p className="font-semibold">{u.name}{u.id === user.id && <span className="ml-1 text-xs text-ink-400">(you)</span>}</p>
                <p className="text-xs text-ink-400">{u.email}</p>
                <details className="mt-2"><summary className="cursor-pointer text-sm font-semibold text-brand-700">Edit</summary>
                  <div className="mt-3 min-w-[320px]">
                    <AdminForm action={saveStaffUserAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="email" value={u.email} />
                      <AField name="name" label="Name" defaultValue={u.name} required />
                      <ASelect name="roleId" label="Role" defaultValue={u.staffRoleId ?? ""}>{roleOptions}</ASelect>
                      <AField name="password" label="New password (optional)" type="password" autoComplete="new-password" hint="Leave empty to keep. Signs them out everywhere." />
                    </AdminForm>
                  </div>
                </details>
              </td>
              <td className={td}><Badge tone="green">{role ?? "—"}</Badge></td>
              <td className={td}>{u.lastLoginAt?.toLocaleString("en-GB") ?? "Never"}</td>
              <td className={td}>{u.status === "active" ? <Badge tone="green">Active</Badge> : <Badge tone="red">Blocked</Badge>}</td>
              <td className={`${td} whitespace-nowrap text-right`}>
                {u.id !== user.id && (
                  <>
                    <form action={setUserStatusAction} className="mr-3 inline">
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="status" value={u.status === "active" ? "blocked" : "active"} />
                      <button className="font-semibold text-ink-600 hover:text-ink-900">{u.status === "active" ? "Block" : "Unblock"}</button>
                    </form>
                    <form action={removeStaffAction} className="inline"><input type="hidden" name="id" value={u.id} /><ConfirmButton message={`Remove admin access for ${u.name}? Their account becomes a regular customer account.`}>Remove access</ConfirmButton></form>
                  </>
                )}
              </td>
            </tr>
          ))}
        </Table>
        <Card className="h-fit p-6">
          <h2 className="mb-1 font-semibold">Add staff member</h2>
          <p className="mb-4 text-sm text-ink-600">If the email already has a customer account, it is upgraded and keeps its password.</p>
          <AdminForm action={saveStaffUserAction} submitLabel="Add staff" resetOnSuccess>
            <AField name="name" label="Name" required />
            <AField name="email" label="Email" type="email" required />
            <ASelect name="roleId" label="Role" defaultValue={roleList.find((r) => r.name === "Staff")?.id}>{roleOptions}</ASelect>
            <AField name="password" label="Initial password" type="password" autoComplete="new-password" hint="Min 8 chars with a letter and a number. Share it securely." />
          </AdminForm>
        </Card>
      </div>
    </>
  );
}
