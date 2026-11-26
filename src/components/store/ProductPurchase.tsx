"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { AddToCartButton, WishlistButton } from "./CartButtons";
import { cn } from "@/lib/utils/cn";

type V = { id: string; name: string; price: number; compareAtPrice: number | null; stock: number };

function fmt(minor: number, cur: string) {
  const major = minor / 100;
  return `${cur}${major.toLocaleString("en-IN", { minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export function QtyStepper({ value, onChange, max, min = 1, label = "Quantity" }: { value: number; onChange: (n: number) => void; max: number; min?: number; label?: string }) {
  return (
    <div className="inline-flex h-12 items-center rounded-xl border border-line bg-white" role="group" aria-label={label}>
      <button type="button" className="grid size-12 place-items-center text-ink-600 hover:text-brand-700 disabled:opacity-40" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease quantity">
        <Minus className="size-4" />
      </button>
      <output className="w-10 text-center font-semibold tabular-nums" aria-live="polite">{value}</output>
      <button type="button" className="grid size-12 place-items-center text-ink-600 hover:text-brand-700 disabled:opacity-40" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function ProductPurchase({ productId, variants, currency, saved, unit }: { productId: string; variants: V[]; currency: string; saved: boolean; unit: string }) {
  const initial = variants.find((v) => v.stock > 0) ?? variants[0];
  const [vid, setVid] = useState(initial?.id);
  const [qty, setQty] = useState(1);
  const v = variants.find((x) => x.id === vid) ?? initial;
  if (!v) return null;
  const off = v.compareAtPrice && v.compareAtPrice > v.price ? Math.round(((v.compareAtPrice - v.price) / v.compareAtPrice) * 100) : 0;
  const max = Math.min(v.stock, 50);

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-display text-3xl font-bold tabular-nums text-ink-900">{fmt(v.price, currency)}</span>
        {off > 0 && (
          <>
            <span className="text-lg text-ink-400 line-through tabular-nums">{fmt(v.compareAtPrice!, currency)}</span>
            <span className="rounded-full bg-tomato-500 px-2.5 py-0.5 text-sm font-bold text-white">Save {off}%</span>
          </>
        )}
        <span className="text-sm text-ink-600">/ {v.name || unit}</span>
      </div>
      <p className={cn("mt-2 text-sm font-medium", v.stock === 0 ? "text-tomato-600" : v.stock <= 5 ? "text-amber-700" : "text-brand-700")}>
        {v.stock === 0 ? "Out of stock" : v.stock <= 5 ? `Only ${v.stock} left — order soon` : "In stock"}
      </p>

      {variants.length > 1 && (
        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-semibold">Choose size</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((x) => (
              <label
                key={x.id}
                className={cn(
                  "cursor-pointer rounded-xl border px-4 py-2.5 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600",
                  x.id === v.id ? "border-brand-700 bg-mint-50 font-semibold text-brand-700" : "border-line hover:border-brand-600",
                  x.stock === 0 && "opacity-50",
                )}
              >
                <input type="radio" name="variant" value={x.id} checked={x.id === v.id} onChange={() => { setVid(x.id); setQty(1); }} className="sr-only" />
                {x.name} · <span className="tabular-nums">{fmt(x.price, currency)}</span>
                {x.stock === 0 && " (sold out)"}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-6 flex flex-wrap items-start gap-3">
        {v.stock > 0 && <QtyStepper value={Math.min(qty, max)} onChange={setQty} max={max} />}
        <div className="min-w-48 flex-1">
          <AddToCartButton variantId={v.id} quantity={Math.min(qty, max)} disabled={v.stock === 0} size="lg" />
        </div>
        <WishlistButton productId={productId} initial={saved} withLabel />
      </div>

      {/* Sticky mobile purchase bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="leading-tight">
          <p className="text-xs text-ink-600">{v.name}</p>
          <p className="font-bold tabular-nums">{fmt(v.price * Math.min(qty, Math.max(max, 1)), currency)}</p>
        </div>
        <div className="flex-1">
          <AddToCartButton variantId={v.id} quantity={Math.min(qty, max)} disabled={v.stock === 0} />
        </div>
      </div>
    </div>
  );
}
