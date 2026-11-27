import { asc, sql } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { PERMISSIONS, PERMISSION_LABELS } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db/client";
import { roles } from "@/lib/db/schema";
import { NoAccess, PageHeader } from "@/components/admin/ui";
import { AdminForm } from "@/components/admin/AdminForm";
import { AField } from "@/components/admin/fields";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Badge, Card, Checkbox } from "@/components/ui";
import { deleteRoleAction, saveRoleAction } from "@/app/admin/actions";

export const metadata = { title: "Roles" };

function PermissionGrid({ selected }: { selected: string[] }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Permissions</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {PERMISSIONS.map((p) => <Checkbox key={p} name="permissions" value={p} label={PERMISSION_LABELS[p]} defaultChecked={selected.includes(p)} />)}
      </div>
    </fieldset>
  );
}

export default async function RolesPage() {
  const { allowed } = await requireStaffPage("roles:write");
  if (!allowed) return <NoAccess />;
  const rows = await getDb()
    .select({ r: roles, members: sql<number>`(select count(*)::int from users u where u.staff_role_id = "roles"."id")` })
    .from(roles)
    .orderBy(asc(roles.name));
  return (
    <>
      <PageHeader title="Roles & permissions" description="Permissions are enforced on the server for every admin page and action." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          {rows.map(({ r, members }) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{r.name} {r.isSystem && <Badge tone="purple">System</Badge>}</p>
                  <p className="text-sm text-ink-600">{r.description} · {members} member{members === 1 ? "" : "s"}</p>
                </div>
                {!r.isSystem && members === 0 && (
                  <form action={deleteRoleAction}><input type="hidden" name="id" value={r.id} /><ConfirmButton message={`Delete role ${r.name}?`}>Delete</ConfirmButton></form>
                )}
              </div>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {r.permissions.includes("*") ? <Badge tone="green">All permissions</Badge> : r.permissions.map((p) => <Badge key={p}>{PERMISSION_LABELS[p as keyof typeof PERMISSION_LABELS] ?? p}</Badge>)}
              </ul>
              {!r.isSystem && (
                <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-brand-700">Edit</summary>
                  <div className="mt-3">
                    <AdminForm action={saveRoleAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <AField name="name" label="Role name" defaultValue={r.name} required />
                      <AField name="description" label="Description" defaultValue={r.description ?? ""} />
                      <PermissionGrid selected={r.permissions} />
                    </AdminForm>
                  </div>
                </details>
              )}
            </Card>
          ))}
        </div>
        <Card className="h-fit p-6">
          <h2 className="mb-4 font-semibold">New role</h2>
          <AdminForm action={saveRoleAction} submitLabel="Create role" resetOnSuccess>
            <AField name="name" label="Role name" required />
            <AField name="description" label="Description" />
            <PermissionGrid selected={["dashboard:read"]} />
          </AdminForm>
        </Card>
      </div>
    </>
  );
}
