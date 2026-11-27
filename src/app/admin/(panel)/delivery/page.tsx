import Link from "next/link";
import { asc } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { deliveryZones, type DeliveryZone } from "@/lib/db/schema";
import { getSettings } from "@/lib/services/settings";
import { getI18n } from "@/lib/i18n/server";
import { NoAccess, PageHeader, Table, td } from "@/components/admin/ui";
import { AdminForm } from "@/components/admin/AdminForm";
import { AField } from "@/components/admin/fields";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Badge, Card, Checkbox } from "@/components/ui";
import { deleteZoneAction, saveZoneAction } from "@/app/admin/actions";

export const metadata = { title: "Delivery" };
const major = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n / 100));

async function ZoneFields({ z, cur }: { z?: DeliveryZone; cur: string }) {
  const { t } = await getI18n();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {z && <input type="hidden" name="id" value={z.id} />}
      <AField name="name" label={t("Area name (English)", "এলাকার নাম (ইংরেজি)")} defaultValue={z?.name} required />
      <AField name="nameBn" label="এলাকার নাম (বাংলা)" lang="bn" defaultValue={z?.nameBn ?? ""} />
      <AField name="etaText" label={t("Delivery time text (English)", "ডেলিভারির সময় (ইংরেজি)")} defaultValue={z?.etaText ?? "Same day"} required />
      <AField name="etaTextBn" label="ডেলিভারির সময় (বাংলা)" lang="bn" defaultValue={z?.etaTextBn ?? ""} />
      <AField name="fee" label={t(`Delivery fee (${cur})`, `ডেলিভারি চার্জ (${cur})`)} type="number" min={0} step="0.01" defaultValue={major(z?.fee ?? 0)} required />
      <AField name="freeAbove" label={t(`Free above (${cur})`, `যত টাকার বেশি হলে ফ্রি (${cur})`)} type="number" min={0} step="0.01" defaultValue={major(z?.freeAbove)} hint={t("Empty = store default", "খালি = সেটিংসের নিয়ম")} />
      <AField name="sortOrder" label={t("Sort order", "ক্রম")} type="number" min={0} defaultValue={String(z?.sortOrder ?? 0)} />
      <div className="flex items-end pb-2"><Checkbox name="isActive" label={t("Active", "চালু")} defaultChecked={z?.isActive ?? true} /></div>
    </div>
  );
}

export default async function DeliveryPage() {
  const { allowed } = await requireStaffPage("delivery:write");
  if (!allowed) return <NoAccess />;
  const [zones, s] = await Promise.all([getDb().select().from(deliveryZones).orderBy(asc(deliveryZones.sortOrder)), getSettings()]);
  const cur = s.currencySymbol;
  const { t, money, slot } = await getI18n();
  return (
    <>
      <PageHeader title={t("Delivery", "ডেলিভারি")} description={t(`Where you deliver and how much it costs. Time slots and the default free-delivery amount (${money(s.freeDeliveryThreshold)}) are in Settings.`, `কোথায় ডেলিভারি দেন আর কত চার্জ। ডেলিভারির সময় আর ফ্রি ডেলিভারির সাধারণ সীমা (${money(s.freeDeliveryThreshold)}) সেটিংসে আছে।`)} actions={<Link href="/admin/settings" className="text-sm font-semibold text-brand-700 hover:underline">{t("Edit time slots →", "সময় বদলান →")}</Link>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Table head={[t("Area", "এলাকা"), t("Fee", "চার্জ"), t("Free above", "ফ্রি যখন"), t("Time", "সময়"), t("Status", "অবস্থা"), ""]}>
            {zones.map((z) => (
              <tr key={z.id} className="align-top">
                <td className={td}><p className="font-semibold">{t(z.name, z.nameBn || z.name)}</p><details className="mt-2"><summary className="cursor-pointer text-sm font-semibold text-brand-700">{t("Edit", "এডিট")}</summary><div className="mt-3 min-w-[380px]"><AdminForm action={saveZoneAction}><ZoneFields z={z} cur={cur} /></AdminForm></div></details></td>
                <td className={`${td} tabular-nums`}>{money(z.fee)}</td>
                <td className={`${td} tabular-nums`}>{money(z.freeAbove ?? s.freeDeliveryThreshold)}</td>
                <td className={td}>{t(z.etaText, z.etaTextBn || z.etaText)}</td>
                <td className={td}>{z.isActive ? <Badge tone="green">{t("Active", "চালু")}</Badge> : <Badge>{t("Off", "বন্ধ")}</Badge>}</td>
                <td className={`${td} text-right`}><form action={deleteZoneAction}><input type="hidden" name="id" value={z.id} /><ConfirmButton message={t(`Delete delivery area ${z.name}?`, `${z.nameBn || z.name} এলাকা মুছবেন?`)}>{t("Delete", "মুছুন")}</ConfirmButton></form></td>
              </tr>
            ))}
          </Table>
          <Card className="p-5 text-sm">
            <h2 className="font-semibold">{t("Delivery time slots", "ডেলিভারির সময়")}</h2>
            <ul className="mt-2 flex flex-wrap gap-2">{s.deliverySlots.map((x) => <li key={x}><Badge tone="green">{slot(x)}</Badge></li>)}</ul>
          </Card>
        </div>
        <Card className="h-fit p-6"><h2 className="mb-4 font-semibold">{t("Add delivery area", "নতুন ডেলিভারি এলাকা")}</h2><AdminForm action={saveZoneAction} submitLabel={t("Add area", "এলাকা যোগ করুন")} resetOnSuccess><ZoneFields cur={cur} /></AdminForm></Card>
      </div>
    </>
  );
}
