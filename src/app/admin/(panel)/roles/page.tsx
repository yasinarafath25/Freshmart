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
import { getI18n } from "@/lib/i18n/server";

const PERMISSION_LABELS_BN: Record<string, string> = {
  "dashboard:read": "ড্যাশবোর্ড দেখা",
  "products:write": "পণ্য ও ক্যাটাগরি সামলানো",
  "inventory:write": "স্টক সামলানো",
  "orders:write": "অর্ডার সামলানো",
  "customers:read": "গ্রাহক ও মেসেজ দেখা",
  "customers:write": "গ্রাহক ব্লক / আনব্লক",
  "coupons:write": "কুপন সামলানো",
  "delivery:write": "ডেলিভারি এলাকা সামলানো",
  "payments:read": "পেমেন্ট দেখা",
  "reviews:write": "রিভিউ অনুমোদন",
  "reports:read": "রিপোর্ট দেখা",
  "settings:write": "স্টোর সেটিংস বদলানো",
  "users:write": "স্টাফ সামলানো",
  "roles:write": "রোল সামলানো",
};

export const metadata = { title: "Roles" };

async function PermissionGrid({ selected }: { selected: string[] }) {
  const { t } = await getI18n();
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{t("Permissions", "অনুমতি")}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {PERMISSIONS.map((p) => <Checkbox key={p} name="permissions" value={p} label={t(PERMISSION_LABELS[p], PERMISSION_LABELS_BN[p] ?? PERMISSION_LABELS[p])} defaultChecked={selected.includes(p)} />)}
      </div>
    </fieldset>
  );
}

export default async function RolesPage() {
  const { allowed } = await requireStaffPage("roles:write");
  if (!allowed) return <NoAccess />;
  const { t, num } = await getI18n();
  const rows = await getDb()
    .select({ r: roles, members: sql<number>`(select count(*)::int from users u where u.staff_role_id = "roles"."id")` })
    .from(roles)
    .orderBy(asc(roles.name));
  return (
    <>
      <PageHeader title={t("Roles & permissions", "রোল ও অনুমতি")} description={t("A role decides what a staff member can see and do. Checked on the server for every page and action.", "রোল ঠিক করে কোন স্টাফ কী দেখতে ও করতে পারবে। প্রতিটি পেজ ও কাজে সার্ভারে যাচাই হয়।")} />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          {rows.map(({ r, members }) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{r.name} {r.isSystem && <Badge tone="purple">{t("Built-in", "সিস্টেমের")}</Badge>}</p>
                  <p className="text-sm text-ink-600">{r.description} · {t(`${members} member${members === 1 ? "" : "s"}`, `${num(members)} জন`)}</p>
                </div>
                {!r.isSystem && members === 0 && (
                  <form action={deleteRoleAction}><input type="hidden" name="id" value={r.id} /><ConfirmButton message={t(`Delete role ${r.name}?`, `${r.name} রোল মুছবেন?`)}>{t("Delete", "মুছুন")}</ConfirmButton></form>
                )}
              </div>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {r.permissions.includes("*") ? <Badge tone="green">{t("All permissions", "সব অনুমতি")}</Badge> : r.permissions.map((p) => <Badge key={p}>{t(PERMISSION_LABELS[p as keyof typeof PERMISSION_LABELS] ?? p, PERMISSION_LABELS_BN[p] ?? p)}</Badge>)}
              </ul>
              {!r.isSystem && (
                <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-brand-700">{t("Edit", "এডিট")}</summary>
                  <div className="mt-3">
                    <AdminForm action={saveRoleAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <AField name="name" label={t("Role name", "রোলের নাম")} defaultValue={r.name} required />
                      <AField name="description" label={t("Description", "বিবরণ")} defaultValue={r.description ?? ""} />
                      <PermissionGrid selected={r.permissions} />
                    </AdminForm>
                  </div>
                </details>
              )}
            </Card>
          ))}
        </div>
        <Card className="h-fit p-6">
          <h2 className="mb-4 font-semibold">{t("New role", "নতুন রোল")}</h2>
          <AdminForm action={saveRoleAction} submitLabel={t("Create role", "রোল তৈরি করুন")} resetOnSuccess>
            <AField name="name" label={t("Role name", "রোলের নাম")} required />
            <AField name="description" label={t("Description", "বিবরণ")} />
            <PermissionGrid selected={["dashboard:read"]} />
          </AdminForm>
        </Card>
      </div>
    </>
  );
}
