import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { requireUserPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { addresses } from "@/lib/db/schema";
import { getCart, getPreferredZone } from "@/lib/services/cart";
import { quoteCheckout } from "@/lib/services/orders";
import { enabledPaymentMethods } from "@/lib/services/payments";
import { getSettings } from "@/lib/services/settings";
import { getI18n } from "@/lib/i18n/server";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { Alert } from "@/components/ui";
import { storeDate } from "@/lib/utils/dates";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.checkout.title, robots: { index: false } };
}

function newToken() {
  return crypto.randomUUID();
}

export default async function CheckoutPage() {
  const user = await requireUserPage("/checkout");
  const [{ cartId, lines }, settings, { zones, zone }, i] = await Promise.all([getCart(), getSettings(), getPreferredZone(), getI18n()]);
  const t = i.d.checkout;
  const available = lines.filter((l) => l.available);
  if (!cartId || available.length === 0) redirect("/cart");
  const saved = await getDb().select().from(addresses).where(eq(addresses.userId, user.id)).orderBy(desc(addresses.isDefault), asc(addresses.createdAt));
  const startZone = saved.find((a) => a.isDefault)?.zoneId ?? zone?.id ?? null;
  const q = await quoteCheckout(user.id, cartId, startZone, null);
  const dates = [0, 1, 2].map((n) => {
    const value = storeDate(settings.timeZone, n);
    return { value, label: n === 0 ? t.today : n === 1 ? t.tomorrow : i.date(value, { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }) };
  });

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t.title}</h1>
      {lines.length !== available.length && (
        <Alert tone="warning" className="mt-4">
          {t.unavailable} <Link href="/cart" className="font-semibold underline">{t.reviewCart}</Link>
        </Alert>
      )}
      <div className="mt-6">
        <CheckoutForm
          token={newToken()}
          addresses={saved}
          zones={zones.map((z) => ({ id: z.id, name: i.pick(z.name, z.nameBn), etaText: i.pick(z.etaText, z.etaTextBn), fee: z.fee }))}
          preferredZoneId={startZone}
          lines={available.map((l) => ({ variantId: l.variantId, productName: i.pick(l.productName, l.productNameBn), variantName: l.variantName, quantity: l.quantity, lineTotal: l.lineTotal, image: l.image }))}
          initialQuote={q.totals}
          dates={dates}
          slots={settings.deliverySlots}
          methods={enabledPaymentMethods(settings.codEnabled).map((m) => ({ id: m.id }))}
          minOrder={settings.minOrder}
        />
      </div>
    </div>
  );
}
