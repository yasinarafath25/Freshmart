import { Card } from "@/components/ui";
import { ProductImage } from "./ProductCard";
import { formatMoney } from "@/lib/utils/money";

type Item = { id: string; image: string | null; productName: string; variantName: string; quantity: number; unitPrice: number; lineTotal: number };

export function OrderItemsCard({ items, currency }: { items: Item[]; currency: string }) {
  return (
    <Card className="divide-y divide-line">
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-4 p-4">
          <ProductImage src={it.image} alt={it.productName} className="size-16 rounded-xl border border-line object-cover" />
          <div className="flex-1">
            <p className="font-semibold">{it.productName}</p>
            <p className="text-sm text-ink-600">{it.variantName} · {it.quantity} × {formatMoney(it.unitPrice, currency)}</p>
          </div>
          <p className="font-semibold tabular-nums">{formatMoney(it.lineTotal, currency)}</p>
        </div>
      ))}
    </Card>
  );
}

export function OrderTotals({
  order,
  currency,
}: {
  order: { subtotal: number; discount: number; couponCode: string | null; deliveryFee: number; total: number; paymentMethod: string };
  currency: string;
}) {
  return (
    <Card className="p-5 text-sm">
      <h2 className="font-semibold">Summary</h2>
      <dl className="mt-3 space-y-2">
        <div className="flex justify-between"><dt className="text-ink-600">Subtotal</dt><dd className="tabular-nums">{formatMoney(order.subtotal, currency)}</dd></div>
        {order.discount > 0 && (
          <div className="flex justify-between text-brand-700"><dt>Discount {order.couponCode && `(${order.couponCode})`}</dt><dd className="tabular-nums">−{formatMoney(order.discount, currency)}</dd></div>
        )}
        <div className="flex justify-between"><dt className="text-ink-600">Delivery</dt><dd className="tabular-nums">{order.deliveryFee ? formatMoney(order.deliveryFee, currency) : "Free"}</dd></div>
        <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{formatMoney(order.total, currency)}</dd></div>
      </dl>
      <p className="mt-3 text-ink-600">Payment: {order.paymentMethod === "cod" ? "Cash on delivery" : "Online (SSLCommerz)"}</p>
    </Card>
  );
}
