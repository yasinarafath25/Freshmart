import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBasket, Trash2, TriangleAlert, Truck } from "lucide-react";
import { getCart, getPreferredZone } from "@/lib/services/cart";
import { getSettings } from "@/lib/services/settings";
import { computeTotals } from "@/lib/services/pricing";
import { formatMoney } from "@/lib/utils/money";
import { clearCartAction, removeCartItemAction } from "@/app/actions/cart";
import { ButtonLink, Card, EmptyState } from "@/components/ui";
import { ProductImage } from "@/components/store/ProductCard";
import { CartQty } from "@/components/store/CartQty";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default async function CartPage() {
  const [{ lines }, settings, { zone }] = await Promise.all([getCart(), getSettings(), getPreferredZone()]);
  const cur = settings.currencySymbol;
  const available = lines.filter((l) => l.available);
  const totals = computeTotals({ lines: available, zone, defaultFreeThreshold: settings.freeDeliveryThreshold });
  const progress = totals.freeDeliveryThreshold > 0 ? Math.min(100, Math.round(((totals.subtotal - totals.discount) / totals.freeDeliveryThreshold) * 100)) : 100;

  if (lines.length === 0) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={<ShoppingBasket className="size-7" />}
          title="Your cart is empty"
          body="Fill it with fresh fruits, vegetables and pantry favourites."
          action={<ButtonLink href="/shop">Start shopping</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Your cart</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {zone && (
            <div className="rounded-2xl border border-line bg-mint-50 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Truck className="size-5 text-brand-700" aria-hidden />
                {totals.amountToFreeDelivery > 0 ? (
                  <>Add <strong className="tabular-nums">{formatMoney(totals.amountToFreeDelivery, cur)}</strong> more for free delivery to {zone.name}.</>
                ) : (
                  <>You’ve unlocked free delivery to {zone.name}!</>
                )}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to free delivery">
                <div className="h-full rounded-full bg-leaf-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <Card className="divide-y divide-line">
            {lines.map((l) => (
              <div key={l.variantId} className={`flex gap-4 p-4 ${l.available ? "" : "bg-amber-50/60"}`}>
                <Link href={`/product/${l.productSlug}`} className="shrink-0 overflow-hidden rounded-xl border border-line bg-canvas">
                  <ProductImage src={l.image} alt={l.productName} className="size-20 object-cover sm:size-24" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${l.productSlug}`} className="font-semibold hover:text-brand-700">{l.productName}</Link>
                    <p className="text-sm text-ink-600">{l.variantName} · <span className="tabular-nums">{formatMoney(l.unitPrice, cur)}</span></p>
                    {l.issue && (
                      <p className="mt-1 flex items-center gap-1 text-sm font-medium text-amber-800">
                        <TriangleAlert className="size-4" aria-hidden /> {l.issue}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    {l.stock > 0 && <CartQty variantId={l.variantId} quantity={Math.min(l.quantity, l.stock)} max={Math.min(l.stock, 50)} />}
                    <p className="w-24 text-right font-semibold tabular-nums">{formatMoney(l.lineTotal, cur)}</p>
                    <form action={removeCartItemAction}>
                      <input type="hidden" name="variantId" value={l.variantId} />
                      <button className="grid size-10 place-items-center rounded-full text-ink-400 hover:bg-red-50 hover:text-tomato-600" aria-label={`Remove ${l.productName}`}>
                        <Trash2 className="size-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </Card>
          <div className="flex justify-between">
            <Link href="/shop" className="text-sm font-semibold text-brand-700 hover:underline">← Continue shopping</Link>
            <form action={clearCartAction}>
              <button className="text-sm text-ink-600 hover:text-tomato-600">Clear cart</button>
            </form>
          </div>
        </div>

        <aside>
          <Card className="sticky top-4 p-5">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-ink-600">Subtotal ({available.reduce((s, l) => s + l.quantity, 0)} items)</dt><dd className="tabular-nums">{formatMoney(totals.subtotal, cur)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-ink-600">Delivery {zone ? `(${zone.name})` : ""}</dt>
                <dd className="tabular-nums">{zone ? (totals.deliveryFee === 0 ? "Free" : formatMoney(totals.deliveryFee, cur)) : "At checkout"}</dd>
              </div>
              <p className="text-xs text-ink-400">Coupons can be applied at checkout.</p>
              <div className="flex justify-between border-t border-line pt-3 text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{formatMoney(totals.total, cur)}</dd></div>
            </dl>
            {totals.subtotal < settings.minOrder && (
              <p className="mt-3 text-sm text-amber-800">Minimum order is {formatMoney(settings.minOrder, cur)}.</p>
            )}
            <ButtonLink href="/checkout" size="lg" className={`mt-5 w-full ${available.length === 0 || totals.subtotal < settings.minOrder ? "pointer-events-none opacity-50" : ""}`} aria-disabled={available.length === 0 || totals.subtotal < settings.minOrder}>
              Proceed to checkout
            </ButtonLink>
          </Card>
        </aside>
      </div>
    </div>
  );
}
