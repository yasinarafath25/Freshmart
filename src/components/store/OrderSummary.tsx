import { Card } from "@/components/ui";
import { ProductImage } from "./ProductCard";
import { DICTS, fmtMoney, fmtNum, unitLabel, type Lang } from "@/lib/i18n/dict";

type Item = { id: string; image: string | null; productName: string; productNameBn?: string | null; variantName: string; quantity: number; unitPrice: number; lineTotal: number };

export function OrderItemsCard({ items, currency, lang = "en" }: { items: Item[]; currency: string; lang?: Lang }) {
  return (
    <Card className="divide-y divide-line">
      {items.map((it) => {
        const name = lang === "bn" && it.productNameBn ? it.productNameBn : it.productName;
        return (
          <div key={it.id} className="flex items-center gap-4 p-4">
            <ProductImage src={it.image} alt={name} className="size-16 rounded-xl border border-line object-cover" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{name}</p>
              <p className="text-sm text-ink-600">
                {unitLabel(it.variantName, lang)} · {fmtNum(it.quantity, lang)} × {fmtMoney(it.unitPrice, currency, lang)}
              </p>
            </div>
            <p className="font-semibold tabular-nums">{fmtMoney(it.lineTotal, currency, lang)}</p>
          </div>
        );
      })}
    </Card>
  );
}

export function OrderTotals({
  order,
  currency,
  lang = "en",
}: {
  order: { subtotal: number; discount: number; couponCode: string | null; deliveryFee: number; total: number; paymentMethod: string };
  currency: string;
  lang?: Lang;
}) {
  const d = DICTS[lang].order;
  const m = (n: number) => fmtMoney(n, currency, lang);
  return (
    <Card className="p-5 text-sm">
      <h2 className="font-semibold">{d.summary}</h2>
      <dl className="mt-3 space-y-2">
        <div className="flex justify-between"><dt className="text-ink-600">{d.subtotal}</dt><dd className="tabular-nums">{m(order.subtotal)}</dd></div>
        {order.discount > 0 && (
          <div className="flex justify-between text-brand-700"><dt>{d.discount} {order.couponCode && `(${order.couponCode})`}</dt><dd className="tabular-nums">−{m(order.discount)}</dd></div>
        )}
        <div className="flex justify-between"><dt className="text-ink-600">{d.delivery}</dt><dd className="tabular-nums">{order.deliveryFee ? m(order.deliveryFee) : d.free}</dd></div>
        <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>{d.total}</dt><dd className="tabular-nums">{m(order.total)}</dd></div>
      </dl>
      <p className="mt-3 text-ink-600">{d.payment}: {order.paymentMethod === "cod" ? d.cod : d.online}</p>
    </Card>
  );
}
