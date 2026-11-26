import Link from "next/link";
import { Star } from "lucide-react";
import type { ProductCardData } from "@/lib/services/catalog";
import { discountPercent, formatMoney } from "@/lib/utils/money";
import { Badge } from "@/components/ui";
import { AddToCartButton, WishlistButton } from "./CartButtons";

export function ProductImage({ src, alt, className, priority }: { src: string | null; alt: string; className?: string; priority?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- plain img: Next image optimiser is not available on Workers (TRD §11)
    <img
      src={src ?? "/images/placeholder.svg"}
      alt={alt}
      width={320}
      height={320}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
    />
  );
}

export function ProductCard({ p, currency, saved = false }: { p: ProductCardData; currency: string; saved?: boolean }) {
  const off = discountPercent(p.price, p.compareAtPrice);
  const outOfStock = p.stock <= 0;
  const unitLabel = p.variantName ?? p.unit;
  return (
    <article className="group relative flex flex-col rounded-2xl border border-line bg-white p-3 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="relative overflow-hidden rounded-xl bg-canvas">
        <Link href={`/product/${p.slug}`} tabIndex={-1} aria-hidden>
          <ProductImage src={p.image} alt="" className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
        </Link>
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {off > 0 && <Badge tone="sale">-{off}%</Badge>}
          {outOfStock && <Badge tone="neutral">Sold out</Badge>}
        </div>
        <div className="absolute right-2 top-2 z-10">
          <WishlistButton productId={p.id} initial={saved} />
        </div>
        <div className="absolute bottom-2 left-2 flex gap-1">
          {p.freshnessLabel && <Badge tone="fresh">{p.freshnessLabel}</Badge>}
          {p.isOrganic && p.freshnessLabel !== "Organic" && <Badge tone="organic">Organic</Badge>}
        </div>
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink-900">
          <Link href={`/product/${p.slug}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
            {p.name}
          </Link>
        </h3>
        {p.ratingCount > 0 && (
          <p className="mt-1 flex items-center gap-1 text-xs text-ink-600">
            <Star className="size-3.5 fill-sun-400 text-sun-400" aria-hidden />
            <span className="font-semibold text-ink-900">{p.ratingAvg.toFixed(1)}</span>
            <span>({p.ratingCount})</span>
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-lg font-bold tabular-nums text-ink-900">
            {p.variantCount > 1 && p.minPrice !== p.maxPrice && p.price === p.minPrice ? "From " : ""}
            {formatMoney(p.price, currency)}
          </span>
          {off > 0 && <span className="text-sm text-ink-400 line-through tabular-nums">{formatMoney(p.compareAtPrice!, currency)}</span>}
          <span className="text-xs text-ink-600">/ {unitLabel}</span>
        </div>
        <div className="relative z-10 mt-3 pt-0.5">
          <AddToCartButton variantId={p.variantId} disabled={outOfStock} size="sm" className="[&>button]:h-10" />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, currency, savedIds, className }: { products: ProductCardData[]; currency: string; savedIds?: Set<string>; className?: string }) {
  return (
    <div className={className ?? "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"}>
      {products.map((p) => (
        <ProductCard key={p.id} p={p} currency={currency} saved={savedIds?.has(p.id)} />
      ))}
    </div>
  );
}
