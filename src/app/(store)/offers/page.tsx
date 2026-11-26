import type { Metadata } from "next";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { TicketPercent } from "lucide-react";
import { CatalogView, type SearchParams } from "@/components/store/CatalogView";
import { getDb } from "@/lib/db/client";
import { coupons } from "@/lib/db/schema";
import { getSettings } from "@/lib/services/settings";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Offers & coupons", description: "Current discounts and coupon codes.", alternates: { canonical: "/offers" } };

export default async function OffersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const now = new Date();
  const [settings, list] = await Promise.all([
    getSettings(),
    getDb()
      .select()
      .from(coupons)
      .where(and(eq(coupons.isPublic, true), eq(coupons.isActive, true), or(isNull(coupons.endsAt), gt(coupons.endsAt, now)))),
  ]);
  const visible = list.filter((c) => (!c.startsAt || c.startsAt <= now) && (c.usageLimit === null || c.usedCount < c.usageLimit));
  const cur = settings.currencySymbol;
  return (
    <>
      {visible.length > 0 && (
        <section className="container-page pt-8" aria-labelledby="coupons-title">
          <h2 id="coupons-title" className="sr-only">Coupon codes</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((c) => (
              <li key={c.id} className="relative flex items-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed border-brand-600/40 bg-mint-50 p-5">
                <TicketPercent className="size-10 shrink-0 text-brand-700" aria-hidden />
                <div>
                  <p className="font-display text-xl font-bold text-brand-900">
                    {c.type === "percent" ? `${c.value}% OFF` : c.type === "fixed" ? `${formatMoney(c.value, cur)} OFF` : "FREE DELIVERY"}
                  </p>
                  <p className="text-sm text-ink-600">{c.description ?? (c.minOrder ? `On orders over ${formatMoney(c.minOrder, cur)}` : "On any order")}</p>
                  <p className="mt-2 text-sm">
                    Use code <code className="rounded-md bg-white px-2 py-0.5 font-bold tracking-wider text-brand-700">{c.code}</code>
                    {c.endsAt && <span className="ml-2 text-xs text-ink-400">until {c.endsAt.toLocaleDateString("en-GB")}</span>}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <CatalogView basePath="/offers" searchParams={await searchParams} fixed={{ onSale: true }} title="Offers" description="Products on sale right now. Apply a coupon code at checkout for extra savings." />
    </>
  );
}
