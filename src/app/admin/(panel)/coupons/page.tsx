import { desc } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { coupons, type Coupon } from "@/lib/db/schema";
import { getSettings } from "@/lib/services/settings";
import { formatMoney } from "@/lib/utils/money";
import { NoAccess, PageHeader, Table, td } from "@/components/admin/ui";
import { AdminForm } from "@/components/admin/AdminForm";
import { AField, ASelect } from "@/components/admin/fields";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Badge, Card, Checkbox } from "@/components/ui";
import { deleteCouponAction, saveCouponAction } from "@/app/admin/actions";

export const metadata = { title: "Coupons" };

const dt = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const major = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n / 100));

function CouponFields({ c, cur }: { c?: Coupon; cur: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <AField name="code" label="Code" defaultValue={c?.code} required className="uppercase" />
      <ASelect name="type" label="Type" defaultValue={c?.type ?? "percent"}>
        <option value="percent">Percentage off</option>
        <option value="fixed">Fixed amount off</option>
        <option value="free_delivery">Free delivery</option>
      </ASelect>
      <AField name="value" label={`Value (% or ${cur})`} type="number" min={0} step="0.01" defaultValue={c ? (c.type === "fixed" ? major(c.value) : String(c.value)) : ""} hint="Ignored for free delivery" />
      <AField name="minOrder" label={`Minimum order (${cur})`} type="number" min={0} step="0.01" defaultValue={major(c?.minOrder ?? 0)} />
      <AField name="maxDiscount" label={`Max discount (${cur})`} type="number" min={0} step="0.01" defaultValue={major(c?.maxDiscount)} hint="For percentage coupons; empty = no cap" />
      <AField name="description" label="Description" defaultValue={c?.description ?? ""} />
      <AField name="startsAt" label="Starts" type="datetime-local" defaultValue={dt(c?.startsAt ?? null)} />
      <AField name="endsAt" label="Ends" type="datetime-local" defaultValue={dt(c?.endsAt ?? null)} />
      <AField name="usageLimit" label="Total uses limit" type="number" min={1} defaultValue={c?.usageLimit ? String(c.usageLimit) : ""} hint="Empty = unlimited" />
      <AField name="perUserLimit" label="Uses per customer" type="number" min={0} defaultValue={String(c?.perUserLimit ?? 1)} hint="0 = unlimited" />
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Checkbox name="isActive" label="Active" defaultChecked={c?.isActive ?? true} />
        <Checkbox name="isPublic" label="Show on Offers page" defaultChecked={c?.isPublic ?? false} />
      </div>
    </div>
  );
}

export default async function CouponsPage() {
  const { allowed } = await requireStaffPage("coupons:write");
  if (!allowed) return <NoAccess />;
  const [rows, settings] = await Promise.all([getDb().select().from(coupons).orderBy(desc(coupons.createdAt)), getSettings()]);
  const cur = settings.currencySymbol;
  const now = new Date();
  return (
    <>
      <PageHeader title="Coupons" description="Discounts are always re-validated on the server at checkout." />
      <div className="grid gap-6 xl:grid-cols-[1fr_440px]">
        <Table head={["Code", "Discount", "Rules", "Used", "Status", ""]}>
          {rows.map((c) => {
            const expired = c.endsAt && c.endsAt < now;
            return (
              <tr key={c.id} className="align-top">
                <td className={td}>
                  <p className="font-mono font-bold">{c.code}</p>
                  <p className="text-xs text-ink-400">{c.description}</p>
                  <details className="mt-2"><summary className="cursor-pointer text-sm font-semibold text-brand-700">Edit</summary><div className="mt-3 min-w-[420px]"><AdminForm action={saveCouponAction}><CouponFields c={c} cur={cur} /></AdminForm></div></details>
                </td>
                <td className={td}>{c.type === "percent" ? `${c.value}%${c.maxDiscount ? ` (max ${formatMoney(c.maxDiscount, cur)})` : ""}` : c.type === "fixed" ? formatMoney(c.value, cur) : "Free delivery"}</td>
                <td className={`${td} text-xs text-ink-600`}>Min {formatMoney(c.minOrder, cur)}<br />{c.perUserLimit ? `${c.perUserLimit}/customer` : "Unlimited/customer"}{c.endsAt && <><br />Ends {c.endsAt.toLocaleDateString("en-GB")}</>}</td>
                <td className={`${td} tabular-nums`}>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                <td className={td}>{!c.isActive ? <Badge>Inactive</Badge> : expired ? <Badge tone="red">Expired</Badge> : <Badge tone="green">Active</Badge>}{c.isPublic && <Badge tone="blue" className="ml-1">Public</Badge>}</td>
                <td className={`${td} text-right`}><form action={deleteCouponAction}><input type="hidden" name="id" value={c.id} /><ConfirmButton message={`Delete coupon ${c.code}?`}>Delete</ConfirmButton></form></td>
              </tr>
            );
          })}
        </Table>
        <Card className="h-fit p-6">
          <h2 className="mb-4 font-semibold">New coupon</h2>
          <AdminForm action={saveCouponAction} submitLabel="Create coupon" resetOnSuccess><CouponFields cur={cur} /></AdminForm>
        </Card>
      </div>
    </>
  );
}
