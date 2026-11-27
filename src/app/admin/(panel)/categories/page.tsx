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
import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Categories" };

type Cat = typeof categories.$inferSelect;

async function CategoryFields({ c, all }: { c?: Cat; all: Cat[] }) {
  const { t, name } = await getI18n();
  return (
    <>
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <AField name="name" label={t("Name (English)", "নাম (ইংরেজি)")} defaultValue={c?.name} required />
        <AField name="nameBn" label="নাম (বাংলা)" lang="bn" defaultValue={c?.nameBn ?? ""} />
        <AField name="slug" label={t("URL slug", "লিংকের নাম (slug)")} defaultValue={c?.slug} hint={t("Auto-generated if empty", "খালি রাখলে নিজেই তৈরি হবে")} />
        <AField name="image" label={t("Image link", "ছবির লিংক")} defaultValue={c?.image ?? ""} placeholder="/images/products/… or https://…" />
        <ASelect name="parentId" label={t("Parent category", "মূল ক্যাটাগরি")} defaultValue={c?.parentId ?? ""}>
          <option value="">{t("— Top level —", "— সবার উপরে —")}</option>
          {all.filter((x) => x.id !== c?.id && !x.parentId).map((x) => <option key={x.id} value={x.id}>{name(x)}</option>)}
        </ASelect>
        <AField name="description" label={t("Description (English)", "বিবরণ (ইংরেজি)")} defaultValue={c?.description ?? ""} className="sm:col-span-2" />
        <AField name="descriptionBn" label="বিবরণ (বাংলা)" lang="bn" defaultValue={c?.descriptionBn ?? ""} className="sm:col-span-2" />
        <AField name="sortOrder" label={t("Sort order", "ক্রম")} type="number" min={0} defaultValue={String(c?.sortOrder ?? 0)} />
        <div className="flex items-end pb-2"><Checkbox name="isActive" label={t("Visible in store", "স্টোরে দেখাবে")} defaultChecked={c?.isActive ?? true} /></div>
      </div>
    </>
  );
}

export default async function CategoriesPage() {
  const { allowed } = await requireStaffPage("products:write");
  if (!allowed) return <NoAccess />;
  const { t, num, name } = await getI18n();
  const rows = await getDb()
    .select({ c: categories, n: sql<number>`(select count(*)::int from products p where p.category_id = "categories"."id")` })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  const all = rows.map((r) => r.c);
  return (
    <>
      <PageHeader title={t("Categories", "ক্যাটাগরি")} description={t("Group your products. Deleting a category leaves its products uncategorised.", "পণ্যগুলোকে ভাগ করে রাখুন। ক্যাটাগরি মুছলে তার পণ্যগুলো ক্যাটাগরি ছাড়া থাকবে।")} />
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <Table head={[t("Category", "ক্যাটাগরি"), t("Products", "পণ্য"), t("Status", "অবস্থা"), ""]}>
          {rows.map(({ c, n }) => (
            <tr key={c.id} className="align-top">
              <td className={td}>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.image && <img src={c.image} alt="" width={36} height={36} className="size-9 rounded-full object-cover" />}
                  <div><p className="font-semibold">{c.parentId && "↳ "}{name(c)}{c.nameBn && <span className="ml-2 font-normal text-ink-400">{t(c.nameBn, c.name)}</span>}</p><p className="text-xs text-ink-400">/category/{c.slug}</p></div>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700">{t("Edit", "এডিট")}</summary>
                  <div className="mt-3"><AdminForm action={saveCategoryAction}><CategoryFields c={c} all={all} /></AdminForm></div>
                </details>
              </td>
              <td className={`${td} tabular-nums`}>{num(n)}</td>
              <td className={td}>{c.isActive ? <Badge tone="green">{t("Visible", "দেখানো হচ্ছে")}</Badge> : <Badge>{t("Hidden", "লুকানো")}</Badge>}</td>
              <td className={`${td} text-right`}>
                <form action={deleteCategoryAction}><input type="hidden" name="id" value={c.id} /><ConfirmButton message={t(`Delete category “${c.name}”? Its ${n} products become uncategorised.`, `“${name(c)}” ক্যাটাগরি মুছবেন? এর ${num(n)}টি পণ্য ক্যাটাগরি ছাড়া থাকবে।`)}>{t("Delete", "মুছুন")}</ConfirmButton></form>
              </td>
            </tr>
          ))}
        </Table>
        <Card className="h-fit p-6">
          <h2 className="mb-4 font-semibold">{t("Add category", "নতুন ক্যাটাগরি")}</h2>
          <AdminForm action={saveCategoryAction} submitLabel={t("Create category", "ক্যাটাগরি তৈরি করুন")} resetOnSuccess><CategoryFields all={all} /></AdminForm>
        </Card>
      </div>
    </>
  );
}
