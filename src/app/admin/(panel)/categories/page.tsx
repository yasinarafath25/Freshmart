import { asc, sql } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";
import { NoAccess, PageHeader, Table, td } from "@/components/admin/ui";
import { AdminForm } from "@/components/admin/AdminForm";
import { AField, ASelect } from "@/components/admin/fields";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Badge, Card, Checkbox } from "@/components/ui";
import { deleteCategoryAction, saveCategoryAction } from "@/app/admin/actions";

export const metadata = { title: "Categories" };

type Cat = typeof categories.$inferSelect;

function CategoryFields({ c, all }: { c?: Cat; all: Cat[] }) {
  return (
    <>
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <AField name="name" label="Name" defaultValue={c?.name} required />
        <AField name="slug" label="Slug" defaultValue={c?.slug} hint="Auto-generated if empty" />
        <AField name="image" label="Image URL" defaultValue={c?.image ?? ""} placeholder="/images/products/… or https://…" />
        <ASelect name="parentId" label="Parent category" defaultValue={c?.parentId ?? ""}>
          <option value="">— Top level —</option>
          {all.filter((x) => x.id !== c?.id && !x.parentId).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </ASelect>
        <AField name="description" label="Description" defaultValue={c?.description ?? ""} className="sm:col-span-2" />
        <AField name="sortOrder" label="Sort order" type="number" min={0} defaultValue={String(c?.sortOrder ?? 0)} />
        <div className="flex items-end pb-2"><Checkbox name="isActive" label="Visible in store" defaultChecked={c?.isActive ?? true} /></div>
      </div>
    </>
  );
}

export default async function CategoriesPage() {
  const { allowed } = await requireStaffPage("products:write");
  if (!allowed) return <NoAccess />;
  const rows = await getDb()
    .select({ c: categories, n: sql<number>`(select count(*)::int from products p where p.category_id = ${categories.id})` })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  const all = rows.map((r) => r.c);
  return (
    <>
      <PageHeader title="Categories" description="Organise products. Deleting a category leaves its products uncategorised." />
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <Table head={["Category", "Products", "Status", ""]}>
          {rows.map(({ c, n }) => (
            <tr key={c.id} className="align-top">
              <td className={td}>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.image && <img src={c.image} alt="" width={36} height={36} className="size-9 rounded-full" />}
                  <div><p className="font-semibold">{c.parentId && "↳ "}{c.name}</p><p className="text-xs text-ink-400">/category/{c.slug}</p></div>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700">Edit</summary>
                  <div className="mt-3"><AdminForm action={saveCategoryAction}><CategoryFields c={c} all={all} /></AdminForm></div>
                </details>
              </td>
              <td className={`${td} tabular-nums`}>{n}</td>
              <td className={td}>{c.isActive ? <Badge tone="green">Visible</Badge> : <Badge>Hidden</Badge>}</td>
              <td className={`${td} text-right`}>
                <form action={deleteCategoryAction}><input type="hidden" name="id" value={c.id} /><ConfirmButton message={`Delete category “${c.name}”? Its ${n} products become uncategorised.`}>Delete</ConfirmButton></form>
              </td>
            </tr>
          ))}
        </Table>
        <Card className="h-fit p-6">
          <h2 className="mb-4 font-semibold">Add category</h2>
          <AdminForm action={saveCategoryAction} submitLabel="Create category" resetOnSuccess><CategoryFields all={all} /></AdminForm>
        </Card>
      </div>
    </>
  );
}
