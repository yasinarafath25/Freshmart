import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBasket, Trash2, TriangleAlert, Truck } from "lucide-react";
import { getCart, getPreferredZone } from "@/lib/services/cart";
import { getSettings } from "@/lib/services/settings";
import { computeTotals } from "@/lib/services/pricing";
import { getI18n } from "@/lib/i18n/server";
import { clearCartAction, removeCartItemAction } from "@/app/actions/cart";
import { ButtonLink, Card, EmptyState } from "@/components/ui";
import { ProductImage } from "@/components/store/ProductCard";
import { CartQty } from "@/components/store/CartQty";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.cart.title, robots: { index: false } };
}

export default async function CartPage() {
  const [{ lines }, settings, { zone }, i] = await Promise.all([getCart(), getSettings(), getPreferredZone(), getI18n()]);
  const c = i.d.cart;
  const available = lines.filter((l) => l.available);
  const totals = computeTotals({ lines: available, zone, defaultFreeThreshold: settings.freeDeliveryThreshold });
  const progress = totals.freeDeliveryThreshold > 0 ? Math.min(100, Math.round(((totals.subtotal - totals.discount) / totals.freeDeliveryThreshold) * 100)) : 100;
  const zoneName = zone ? i.pick(zone.name, zone.nameBn) : "";
  const issue = (l: (typeof lines)[number]) =>
    !l.issue ? null : l.issue === "No longer available" ? c.issues.gone : l.issue === "Out of stock" ? c.issues.out : c.issues.only(i.num(l.stock));
  const blocked = available.length === 0 || totals.subtotal < settings.minOrder;

  if (lines.length === 0) {
    return (
      <div className="container-page py-12">
        <EmptyState icon={<ShoppingBasket className="size-7" />} title={c.empty} body={c.emptyBody} action={<ButtonLink href="/shop">{c.startShopping}</ButtonLink>} />
      </div>
    );
  }

  return (
    <div className="container-page py-8 pb-28 lg:pb-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{c.title}</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-4">
          {zone && (
            <div className="rounded-2xl border border-line bg-mint-50 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Truck className="size-5 shrink-0 text-brand-700" aria-hidden />
                {totals.amountToFreeDelivery > 0 ? c.addMore(i.money(totals.amountToFreeDelivery), zoneName) : c.unlocked(zoneName)}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={c.progress}>
                <div className="h-full rounded-full bg-leaf-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <Card className="divide-y divide-line">
            {lines.map((l) => {
              const name = i.pick(l.productName, l.productNameBn);
              const problem = issue(l);
              return (
                <div key={l.variantId} className={`flex gap-4 p-4 ${l.available ? "" : "bg-amber-50/60"}`}>
                  <Link href={`/product/${l.productSlug}`} className="shrink-0 overflow-hidden rounded-xl border border-line bg-canvas">
                    <ProductImage src={l.image} alt={name} className="size-20 object-cover sm:size-24" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <Link href={`/product/${l.productSlug}`} className="font-semibold hover:text-brand-700">{name}</Link>
                      <p className="text-sm text-ink-600">{i.unit(l.variantName)} · <span className="tabular-nums">{i.money(l.unitPrice)}</span></p>
                      {problem && (
                        <p className="mt-1 flex items-center gap-1 text-sm font-medium text-amber-800">
                          <TriangleAlert className="size-4" aria-hidden /> {problem}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      {l.stock > 0 && <CartQty variantId={l.variantId} quantity={Math.min(l.quantity, l.stock)} max={Math.min(l.stock, 50)} />}
                      <p className="w-20 text-right font-semibold tabular-nums">{i.money(l.lineTotal)}</p>
                      <form action={removeCartItemAction}>
                        <input type="hidden" name="variantId" value={l.variantId} />
                        <button className="grid size-10 place-items-center rounded-full text-ink-400 hover:bg-red-50 hover:text-tomato-600" aria-label={c.remove(name)}>
                          <Trash2 className="size-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
          <div className="flex justify-between">
            <Link href="/shop" className="text-sm font-semibold text-brand-700 hover:underline">{c.continue}</Link>
            <form action={clearCartAction}>
              <button className="text-sm text-ink-600 hover:text-tomato-600">{c.clear}</button>
            </form>
          </div>
        </div>

        <aside>
          <Card className="sticky top-4 p-5">
            <h2 className="text-lg font-semibold">{c.summary}</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-ink-600">{c.subtotal(i.num(available.reduce((s, l) => s + l.quantity, 0)))}</dt><dd className="tabular-nums">{i.money(totals.subtotal)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-ink-600">{c.delivery} {zone ? `(${zoneName})` : ""}</dt>
                <dd className="tabular-nums">{zone ? (totals.deliveryFee === 0 ? c.free : i.money(totals.deliveryFee)) : c.atCheckout}</dd>
              </div>
              <p className="text-xs text-ink-400">{c.couponHint}</p>
              <div className="flex justify-between border-t border-line pt-3 text-base font-bold"><dt>{c.total}</dt><dd className="tabular-nums">{i.money(totals.total)}</dd></div>
            </dl>
            {totals.subtotal < settings.minOrder && <p className="mt-3 text-sm text-amber-800">{c.minOrder(i.money(settings.minOrder))}</p>}
            <ButtonLink href="/checkout" size="lg" className={`mt-5 hidden w-full lg:flex ${blocked ? "pointer-events-none opacity-50" : ""}`} aria-disabled={blocked}>
              {c.checkout}
            </ButtonLink>
          </Card>
        </aside>
      </div>

      {/* Sticky checkout bar on phones */}
      <div className="fixed inset-x-0 bottom-16 z-30 flex items-center gap-3 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgb(16_40_24/0.08)] backdrop-blur lg:hidden">
        <div className="leading-tight">
          <p className="text-xs text-ink-600">{c.total}</p>
          <p className="text-lg font-bold tabular-nums">{i.money(totals.total)}</p>
        </div>
        <ButtonLink href="/checkout" className={`flex-1 ${blocked ? "pointer-events-none opacity-50" : ""}`} aria-disabled={blocked}>
          {c.checkout}
        </ButtonLink>
      </div>
    </div>
  );
}
