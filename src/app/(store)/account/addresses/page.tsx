import type { Metadata } from "next";
import { asc, desc, eq } from "drizzle-orm";
import { MapPin } from "lucide-react";
import { requireUserPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { addresses } from "@/lib/db/schema";
import { listActiveZones } from "@/lib/services/cart";
import { Badge, Card, EmptyState } from "@/components/ui";
import { AddressForm } from "@/components/store/AccountForms";
import { deleteAddressAction, setDefaultAddressAction } from "@/app/actions/account";

export const metadata: Metadata = { title: "Addresses", robots: { index: false } };

export default async function AddressesPage() {
  const user = await requireUserPage("/account/addresses");
  const [list, zones] = await Promise.all([
    getDb().select().from(addresses).where(eq(addresses.userId, user.id)).orderBy(desc(addresses.isDefault), asc(addresses.createdAt)),
    listActiveZones(),
  ]);
  const zoneList = zones.map((z) => ({ id: z.id, name: z.name }));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Addresses</h1>
      {list.length === 0 ? (
        <EmptyState icon={<MapPin className="size-7" />} title="No saved addresses" body="Add an address below to check out faster." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{a.label}</p>
                {a.isDefault && <Badge tone="green">Default</Badge>}
              </div>
              <p className="mt-2 text-sm text-ink-900">{a.fullName} · {a.phone}</p>
              <p className="text-sm text-ink-600">{[a.line1, a.line2, a.area, a.city, a.postalCode].filter(Boolean).join(", ")}</p>
              <p className="text-xs text-ink-400">Delivery area: {zones.find((z) => z.id === a.zoneId)?.name ?? "—"}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {!a.isDefault && (
                  <form action={setDefaultAddressAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="font-semibold text-ink-600 hover:text-brand-700">Make default</button>
                  </form>
                )}
                <form action={deleteAddressAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="font-semibold text-ink-600 hover:text-tomato-600">Delete</button>
                </form>
                <details className="w-full">
                  <summary className="cursor-pointer font-semibold text-brand-700">Edit</summary>
                  <div className="mt-4"><AddressForm zones={zoneList} initial={a} /></div>
                </details>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Add a new address</h2>
        <AddressForm zones={zoneList} />
      </Card>
    </div>
  );
}
