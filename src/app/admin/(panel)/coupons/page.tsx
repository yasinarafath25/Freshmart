import { desc } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { coupons, type Coupon } from "@/lib/db/schema";
import { getSettings } from "@/lib/services/settings";
import { getI18n } from "@/lib/i18n/server";
import { NoAccess, PageHeader, Table, td } from "@/components/admin/ui";
import { AdminForm } from "@/components/admin/AdminForm";
import { AField, ASelect } from "@/components/admin/fields";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Badge, Card, Checkbox } from "@/components/ui";
import { deleteCouponAction, saveCouponAction } from "@/app/admin/actions";

export const metadata = { title: "Coupons" };

const dt = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const major = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n / 100));

async function CouponFields({ c, cur }: { c?: Coupon; cur: string }) {
  const { t } = await getI18n();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <AField name="code" label={t("Code", "কোড")} defaultValue={c?.code} required className="uppercase" />
      <ASelect name="type" label={t("Type", "ধরন")} defaultValue={c?.type ?? "percent"}>
        <option value="percent">{t("Percentage off", "শতাংশ ছাড় (%)")}</option>
        <option value="fixed">{t("Fixed amount off", "নির্দিষ্ট টাকা ছাড়")}</option>
        <option value="free_delivery">{t("Free delivery", "ফ্রি ডেলিভারি")}</option>
      </ASelect>
      <AField name="value" label={t(`Value (% or ${cur})`, `পরিমাণ (% বা ${cur})`)} type="number" min={0} step="0.01" defaultValue={c ? (c.type === "fixed" ? major(c.value) : String(c.value)) : ""} hint={t("Ignored for free delivery", "ফ্রি ডেলিভারির জন্য লাগবে না")} />
      <AField name="minOrder" label={t(`Minimum order (${cur})`, `সর্বনিম্ন অর্ডার (${cur})`)} type="number" min={0} step="0.01" defaultValue={major(c?.minOrder ?? 0)} />
      <AField name="maxDiscount" label={t(`Max discount (${cur})`, `সর্বোচ্চ ছাড় (${cur})`)} type="number" min={0} step="0.01" defaultValue={major(c?.maxDiscount)} hint={t("For percentage coupons; empty = no cap", "শতাংশ কুপনের জন্য; খালি = সীমা নেই")} />
      <AField name="description" label={t("Description", "বিবরণ")} defaultValue={c?.description ?? ""} />
      <AField name="startsAt" label={t("Starts", "শুরু")} type="datetime-local" defaultValue={dt(c?.startsAt ?? null)} />
      <AField name="endsAt" label={t("Ends", "শেষ")} type="datetime-local" defaultValue={dt(c?.endsAt ?? null)} />
      <AField name="usageLimit" label={t("Total uses limit", "মোট কতবার ব্যবহার করা যাবে")} type="number" min={1} defaultValue={c?.usageLimit ? String(c.usageLimit) : ""} hint={t("Empty = unlimited", "খালি = সীমাহীন")} />
      <AField name="perUserLimit" label={t("Uses per customer", "প্রতি গ্রাহক কতবার")} type="number" min={0} defaultValue={String(c?.perUserLimit ?? 1)} hint={t("0 = unlimited", "০ = সীমাহীন")} />
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Checkbox name="isActive" label={t("Active", "চালু")} defaultChecked={c?.isActive ?? true} />
        <Checkbox name="isPublic" label={t("Show on Offers page", "অফার পেজে দেখাবে")} defaultChecked={c?.isPublic ?? false} />
      </div>
    </div>
  );
}

export default async function CouponsPage() {
  const { allowed } = await requireStaffPage("coupons:write");
  if (!allowed) return <NoAccess />;
  const [rows, settings, { t, money, num, date }] = await Promise.all([getDb().select().from(coupons).orderBy(desc(coupons.createdAt)), getSettings(), getI18n()]);
  const cur = settings.currencySymbol;
  const now = new Date();
  return (
    <>
      <PageHeader title={t("Coupons & offers", "কুপন ও অফার")} description={t("Create discount codes for customers. Codes are checked again at checkout, so they can’t be misused.", "গ্রাহকদের জন্য ছাড়ের কোড তৈরি করুন। চেকআউটে কোড আবার যাচাই হয়, তাই অপব্যবহার করা যায় না।")} />
      <div className="grid gap-6 xl:grid-cols-[1fr_440px]">
        <Table head={[t("Code", "কোড"), t("Discount", "ছাড়"), t("Rules", "শর্ত"), t("Used", "ব্যবহার"), t("Status", "অবস্থা"), ""]}>
          {rows.map((c) => {
            const expired = c.endsAt && c.endsAt < now;
            return (
              <tr key={c.id} className="align-top">
                <td className={td}>
                  <p className="font-mono font-bold">{c.code}</p>
                  <p className="text-xs text-ink-400">{c.description}</p>
                  <details className="mt-2"><summary className="cursor-pointer text-sm font-semibold text-brand-700">{t("Edit", "এডিট")}</summary><div className="mt-3 min-w-[420px]"><AdminForm action={saveCouponAction}><CouponFields c={c} cur={cur} /></AdminForm></div></details>
                </td>
                <td className={td}>{c.type === "percent" ? `${num(c.value)}%${c.maxDiscount ? ` (${t("max", "সর্বোচ্চ")} ${money(c.maxDiscount)})` : ""}` : c.type === "fixed" ? money(c.value) : t("Free delivery", "ফ্রি ডেলিভারি")}</td>
                <td className={`${td} text-xs text-ink-600`}>{t("Min", "সর্বনিম্ন")} {money(c.minOrder)}<br />{c.perUserLimit ? t(`${c.perUserLimit}/customer`, `প্রতি গ্রাহক ${num(c.perUserLimit)} বার`) : t("Unlimited/customer", "প্রতি গ্রাহক সীমাহীন")}{c.endsAt && <><br />{t("Ends", "শেষ")} {date(c.endsAt)}</>}</td>
                <td className={`${td} tabular-nums`}>{num(c.usedCount)}{c.usageLimit ? ` / ${num(c.usageLimit)}` : ""}</td>
                <td className={td}>{!c.isActive ? <Badge>{t("Off", "বন্ধ")}</Badge> : expired ? <Badge tone="red">{t("Expired", "মেয়াদ শেষ")}</Badge> : <Badge tone="green">{t("Active", "চালু")}</Badge>}{c.isPublic && <Badge tone="blue" className="ml-1">{t("Public", "সবার জন্য")}</Badge>}</td>
                <td className={`${td} text-right`}><form action={deleteCouponAction}><input type="hidden" name="id" value={c.id} /><ConfirmButton message={t(`Delete coupon ${c.code}?`, `${c.code} কুপন মুছবেন?`)}>{t("Delete", "মুছুন")}</ConfirmButton></form></td>
              </tr>
            );
          })}
        </Table>
        <Card className="h-fit p-6">
          <h2 className="mb-4 font-semibold">{t("New coupon", "নতুন কুপন")}</h2>
          <AdminForm action={saveCouponAction} submitLabel={t("Create coupon", "কুপন তৈরি করুন")} resetOnSuccess><CouponFields cur={cur} /></AdminForm>
        </Card>
      </div>
    </>
  );
}
