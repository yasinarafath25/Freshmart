import Link from "next/link";
import { asc } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { deliveryZones, type DeliveryZone } from "@/lib/db/schema";
import { getSettings } from "@/lib/services/settings";
import { formatMoney } from "@/lib/utils/money";
import { NoAccess, PageHeader, Table, td } from "@/components/admin/ui";
import { AdminForm } from "@/components/admin/AdminForm";
import { AField } from "@/components/admin/fields";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Badge, Card, Checkbox } from "@/components/ui";
import { deleteZoneAction, saveZoneAction } from "@/app/admin/actions";

export const metadata = { title: "Delivery" };
const major = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n / 100));

function ZoneFields({ z, cur }: { z?: DeliveryZone; cur: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {z && <input type="hidden" name="id" value={z.id} />}
      <AField name="name" label="Area name" defaultValue={z?.name} required />
      <AField name="etaText" label="Delivery time text" defaultValue={z?.etaText ?? "Same day"} required />
      <AField name="fee" label={`Delivery fee (${cur})`} type="number" min={0} step="0.01" defaultValue={major(z?.fee ?? 0)} required />
      <AField name="freeAbove" label={`Free above (${cur})`} type="number" min={0} step="0.01" defaultValue={major(z?.freeAbove)} hint="Empty = store default" />
      <AField name="sortOrder" label="Sort order" type="number" min={0} defaultValue={String(z?.sortOrder ?? 0)} />
      <div className="flex items-end pb-2"><Checkbox name="isActive" label="Active" defaultChecked={z?.isActive ?? true} /></div>
    </div>
  );
}

export default async function DeliveryPage() {
  const { allowed } = await requireStaffPage("delivery:write");
  if (!allowed) return <NoAccess />;
  const [zones, s] = await Promise.all([getDb().select().from(deliveryZones).orderBy(asc(deliveryZones.sortOrder)), getSettings()]);
  const cur = s.currencySymbol;
  return (
    <>
      <PageHeader title="Delivery" description={`Delivery areas and fees. Time slots and the default free-delivery threshold (${formatMoney(s.freeDeliveryThreshold, cur)}) are in Settings.`} actions={<Link href="/admin/settings" className="text-sm font-semibold text-brand-700 hover:underline">Edit slots →</Link>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Table head={["Area", "Fee", "Free above", "ETA", "Status", ""]}>
            {zones.map((z) => (
              <tr key={z.id} className="align-top">
                <td className={td}><p className="font-semibold">{z.name}</p><details className="mt-2"><summary className="cursor-pointer text-sm font-semibold text-brand-700">Edit</summary><div className="mt-3 min-w-[380px]"><AdminForm action={saveZoneAction}><ZoneFields z={z} cur={cur} /></AdminForm></div></details></td>
                <td className={`${td} tabular-nums`}>{formatMoney(z.fee, cur)}</td>
                <td className={`${td} tabular-nums`}>{formatMoney(z.freeAbove ?? s.freeDeliveryThreshold, cur)}</td>
                <td className={td}>{z.etaText}</td>
                <td className={td}>{z.isActive ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}</td>
                <td className={`${td} text-right`}><form action={deleteZoneAction}><input type="hidden" name="id" value={z.id} /><ConfirmButton message={`Delete delivery area ${z.name}?`}>Delete</ConfirmButton></form></td>
              </tr>
            ))}
          </Table>
          <Card className="p-5 text-sm">
            <h2 className="font-semibold">Delivery slots</h2>
            <ul className="mt-2 flex flex-wrap gap-2">{s.deliverySlots.map((x) => <li key={x}><Badge tone="green">{x}</Badge></li>)}</ul>
          </Card>
        </div>
        <Card className="h-fit p-6"><h2 className="mb-4 font-semibold">Add delivery area</h2><AdminForm action={saveZoneAction} submitLabel="Add area" resetOnSuccess><ZoneFields cur={cur} /></AdminForm></Card>
      </div>
    </>
  );
}
