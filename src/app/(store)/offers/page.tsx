import type { Metadata } from "next";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { TicketPercent } from "lucide-react";
import { CatalogView, type SearchParams } from "@/components/store/CatalogView";
import { CopyCode } from "@/components/store/CopyCode";
import { getDb } from "@/lib/db/client";
import { coupons } from "@/lib/db/schema";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.catalog.offers, description: d.catalog.offersDesc, alternates: { canonical: "/offers" } };
}

export default async function OffersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const now = new Date();
  const [i, list] = await Promise.all([
    getI18n(),
    getDb()
      .select()
      .from(coupons)
      .where(and(eq(coupons.isPublic, true), eq(coupons.isActive, true), or(isNull(coupons.endsAt), gt(coupons.endsAt, now)))),
  ]);
  const c = i.d.catalog;
  const visible = list.filter((x) => (!x.startsAt || x.startsAt <= now) && (x.usageLimit === null || x.usedCount < x.usageLimit));
  return (
    <>
      {visible.length > 0 && (
        <section className="container-page pt-8" aria-label={c.useCode}>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((x) => (
              <li key={x.id} className="relative flex items-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed border-brand-600/40 bg-mint-50 p-5">
                <TicketPercent className="size-10 shrink-0 text-brand-700" aria-hidden />
                <div>
                  <p className="font-display text-xl font-bold text-brand-900">
                    {x.type === "percent" ? c.percentOff(i.num(x.value)) : x.type === "fixed" ? c.amountOff(i.money(x.value)) : c.freeDelivery}
                  </p>
                  <p className="text-sm text-ink-600">
                    {i.lang === "en" && x.description ? x.description : x.minOrder ? c.onOrdersOver(i.money(x.minOrder)) : c.anyOrder}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    {c.useCode} <CopyCode code={x.code} copyLabel={i.lang === "bn" ? "কপি করুন" : "Copy"} copiedLabel={i.lang === "bn" ? "কপি হয়েছে" : "Copied"} />
                    {x.endsAt && <span className="text-xs text-ink-400">{c.until} {i.date(x.endsAt)}</span>}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <CatalogView basePath="/offers" searchParams={await searchParams} fixed={{ onSale: true }} title={c.offers} description={c.offersDesc} />
    </>
  );
}
