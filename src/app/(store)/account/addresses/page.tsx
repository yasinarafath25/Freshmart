import type { Metadata } from "next";
import { asc, desc, eq } from "drizzle-orm";
import { MapPin } from "lucide-react";
import { requireUserPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { addresses } from "@/lib/db/schema";
import { listActiveZones } from "@/lib/services/cart";
import { getI18n } from "@/lib/i18n/server";
import { Badge, Card, EmptyState } from "@/components/ui";
import { AddressForm } from "@/components/store/AccountForms";
import { deleteAddressAction, setDefaultAddressAction } from "@/app/actions/account";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.account.addresses, robots: { index: false } };
}

export default async function AddressesPage() {
  const user = await requireUserPage("/account/addresses");
  const [list, zones, i] = await Promise.all([
    getDb().select().from(addresses).where(eq(addresses.userId, user.id)).orderBy(desc(addresses.isDefault), asc(addresses.createdAt)),
    listActiveZones(),
    getI18n(),
  ]);
  const a = i.d.account;
  const zoneList = zones.map((z) => ({ id: z.id, name: i.pick(z.name, z.nameBn) }));
  const labelOf = (l: string) => (a.labels as Record<string, string>)[l] ?? l;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{a.addresses}</h1>
      {list.length === 0 ? (
        <EmptyState icon={<MapPin className="size-7" />} title={a.noAddresses} body={a.noAddressesBody} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((ad) => (
            <Card key={ad.id} className="p-5">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{labelOf(ad.label)}</p>
                {ad.isDefault && <Badge tone="green">{a.default}</Badge>}
              </div>
              <p className="mt-2 text-sm text-ink-900">{ad.fullName} · {ad.phone}</p>
              <p className="text-sm text-ink-600">{[ad.line1, ad.line2, ad.area, ad.city, ad.postalCode].filter(Boolean).join(", ")}</p>
              <p className="text-xs text-ink-400">{a.deliveryArea}: {zoneList.find((z) => z.id === ad.zoneId)?.name ?? "—"}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {!ad.isDefault && (
                  <form action={setDefaultAddressAction}>
                    <input type="hidden" name="id" value={ad.id} />
                    <button className="font-semibold text-ink-600 hover:text-brand-700">{a.makeDefault}</button>
                  </form>
                )}
                <form action={deleteAddressAction}>
                  <input type="hidden" name="id" value={ad.id} />
                  <button className="font-semibold text-ink-600 hover:text-tomato-600">{i.d.common.delete}</button>
                </form>
                <details className="w-full">
                  <summary className="cursor-pointer font-semibold text-brand-700">{i.d.common.edit}</summary>
                  <div className="mt-4"><AddressForm zones={zoneList} initial={ad} /></div>
                </details>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">{a.addAddress}</h2>
        <AddressForm zones={zoneList} />
      </Card>
    </div>
  );
}
