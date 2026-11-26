import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { requireUserPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { addresses } from "@/lib/db/schema";
import { getCart, getPreferredZone } from "@/lib/services/cart";
import { quoteCheckout } from "@/lib/services/orders";
import { enabledPaymentMethods } from "@/lib/services/payments";
import { getSettings } from "@/lib/services/settings";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { Alert } from "@/components/ui";
import Link from "next/link";
import { storeDate } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

function deliveryDates(tz: string) {
  return Array.from({ length: 3 }, (_, i) => {
    const value = storeDate(tz, i);
    const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : new Date(value + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
    return { value, label };
  });
}

function newToken() {
  return crypto.randomUUID();
}

export default async function CheckoutPage() {
  const user = await requireUserPage("/checkout");
  const [{ cartId, lines }, settings, { zones, zone }] = await Promise.all([getCart(), getSettings(), getPreferredZone()]);
  const available = lines.filter((l) => l.available);
  if (!cartId || available.length === 0) redirect("/cart");
  const saved = await getDb().select().from(addresses).where(eq(addresses.userId, user.id)).orderBy(desc(addresses.isDefault), asc(addresses.createdAt));
  const startZone = saved.find((a) => a.isDefault)?.zoneId ?? zone?.id ?? null;
  const q = await quoteCheckout(user.id, cartId, startZone, null);
  const dates = deliveryDates(settings.timeZone);

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Checkout</h1>
      {lines.length !== available.length && (
        <Alert tone="warning" className="mt-4">
          Some items in your cart are unavailable and won’t be included. <Link href="/cart" className="font-semibold underline">Review cart</Link>
        </Alert>
      )}
      <div className="mt-6">
        <CheckoutForm
          token={newToken()}
          addresses={saved}
          zones={zones.map((z) => ({ id: z.id, name: z.name, etaText: z.etaText, fee: z.fee }))}
          preferredZoneId={startZone}
          lines={available.map((l) => ({ variantId: l.variantId, productName: l.productName, variantName: l.variantName, quantity: l.quantity, lineTotal: l.lineTotal, image: l.image }))}
          initialQuote={q.totals}
          dates={dates}
          slots={settings.deliverySlots}
          methods={enabledPaymentMethods(settings.codEnabled)}
          currency={settings.currencySymbol}
          minOrder={settings.minOrder}
        />
      </div>
    </div>
  );
}
