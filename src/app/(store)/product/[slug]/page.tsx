import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Leaf, MapPin, RotateCcw, Star, Truck } from "lucide-react";
import { getApprovedReviews, getProductBySlug, getWishlistIds, listProducts } from "@/lib/services/catalog";
import { getSettings } from "@/lib/services/settings";
import { getCurrentUser } from "@/lib/auth/session";
import { canReview } from "@/lib/services/reviews";
import { getPreferredZone } from "@/lib/services/cart";
import { getI18n } from "@/lib/i18n/server";
import { ProductImage, ProductGrid } from "@/components/store/ProductCard";
import { ProductPurchase } from "@/components/store/ProductPurchase";
import { ReviewForm } from "@/components/store/ReviewForm";
import { Badge, SectionHeading } from "@/components/ui";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [p, i] = await Promise.all([getProductBySlug((await params).slug), getI18n()]);
  if (!p) return { title: i.d.errors.notFoundTitle };
  return {
    title: i.name(p),
    description: i.pick(p.description, p.descriptionBn).slice(0, 160),
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { images: p.images.slice(0, 1) },
  };
}

function Stars({ value, label, className = "size-4" }: { value: number; label: string; className?: string }) {
  return (
    <span className="flex gap-0.5" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${className} ${n <= Math.round(value) ? "fill-sun-400 text-sun-400" : "text-line"}`} aria-hidden />
      ))}
    </span>
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const user = await getCurrentUser();
  const [settings, reviews, saved, related, eligibility, { zone }, i] = await Promise.all([
    getSettings(),
    getApprovedReviews(p.id),
    getWishlistIds(user?.id),
    listProducts({ categoryIds: p.categoryId ? [p.categoryId] : undefined, excludeId: p.id, perPage: 5, inStock: true }),
    user ? canReview(user.id, p.id) : Promise.resolve(null),
    getPreferredZone(),
    getI18n(),
  ]);
  const t = i.d.product;
  const name = i.name(p);
  const appUrl = process.env.APP_URL ?? "";
  const def = p.variants.find((v) => v.isDefault) ?? p.variants[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    alternateName: p.nameBn ?? undefined,
    description: p.description,
    image: p.images.map((src) => (src.startsWith("http") ? src : `${appUrl}${src}`)),
    sku: def?.sku,
    category: p.category?.name,
    ...(p.ratingCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.ratingAvg.toFixed(1), reviewCount: p.ratingCount } } : {}),
    offers: p.variants.map((v) => ({
      "@type": "Offer",
      name: v.name,
      price: (v.price / 100).toFixed(2),
      priceCurrency: settings.currencyCode,
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${appUrl}/product/${p.slug}`,
    })),
  };

  return (
    <div className="container-page pb-40 pt-6 md:pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label={i.d.catalog.breadcrumb} className="text-sm text-ink-600">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link href="/" className="hover:text-brand-700">{i.d.common.home}</Link></li>
          <li aria-hidden>/</li>
          {p.category && (
            <>
              <li><Link href={`/category/${p.category.slug}`} className="hover:text-brand-700">{i.name(p.category)}</Link></li>
              <li aria-hidden>/</li>
            </>
          )}
          <li aria-current="page" className="font-medium text-ink-900">{name}</li>
        </ol>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-line bg-canvas">
            <ProductImage src={p.images[0] ?? null} alt={name} priority className="aspect-square w-full object-cover" />
            <div className="absolute left-4 top-4 flex gap-2">
              {p.freshnessLabel && <Badge tone="fresh">{i.d.badges[p.freshnessLabel] ?? p.freshnessLabel}</Badge>}
              {p.isOrganic && <Badge tone="organic"><Leaf className="size-3" aria-hidden /> {t.organic}</Badge>}
            </div>
          </div>
          {p.images.length > 1 && (
            <ul className="mt-3 grid grid-cols-5 gap-2">
              {p.images.slice(1, 6).map((src) => (
                <li key={src} className="overflow-hidden rounded-xl border border-line">
                  <ProductImage src={src} alt={name} className="aspect-square w-full object-cover" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {p.category && <p className="text-sm font-semibold uppercase tracking-wide text-leaf-500">{i.name(p.category)}</p>}
          <h1 className="mt-1 text-3xl font-bold leading-tight sm:text-4xl">{name}</h1>
          {i.lang === "bn" && p.nameBn && <p className="mt-1 text-sm text-ink-400">{p.name}</p>}
          {i.lang === "en" && p.nameBn && <p className="mt-1 text-sm text-ink-400" lang="bn">{p.nameBn}</p>}
          <div className="mt-2 flex items-center gap-2 text-sm text-ink-600">
            {p.ratingCount > 0 ? (
              <>
                <Stars value={p.ratingAvg} label={`${i.num(p.ratingAvg.toFixed(1))} / ${i.num(5)}`} />
                <a href="#reviews" className="hover:text-brand-700">{t.reviewsCount(i.num(p.ratingAvg.toFixed(1)), i.num(p.ratingCount))}</a>
              </>
            ) : (
              <span>{t.noReviews}</span>
            )}
          </div>
          <div className="mt-5">
            <ProductPurchase
              productId={p.id}
              productName={name}
              unit={p.unit}
              saved={saved.has(p.id)}
              variants={p.variants.map((v) => ({ id: v.id, name: v.name, price: v.price, compareAtPrice: v.compareAtPrice, stock: v.stock }))}
            />
          </div>

          <ul className="mt-6 grid gap-3 rounded-2xl bg-mint-50 p-4 text-sm sm:grid-cols-2">
            <li className="flex gap-2.5"><BadgeCheck className="size-5 shrink-0 text-brand-700" aria-hidden /> {t.guarantee}</li>
            <li className="flex gap-2.5"><Truck className="size-5 shrink-0 text-brand-700" aria-hidden /> {zone ? `${i.pick(zone.name, zone.nameBn)}: ${i.pick(zone.etaText, zone.etaTextBn)}` : t.fastDelivery}</li>
            <li className="flex gap-2.5"><RotateCcw className="size-5 shrink-0 text-brand-700" aria-hidden /> {t.easyReturns}</li>
            {p.origin && <li className="flex gap-2.5"><MapPin className="size-5 shrink-0 text-brand-700" aria-hidden /> {t.origin(i.lang === "bn" && p.origin === "Local farms" ? "স্থানীয় খামার" : p.origin)}</li>}
          </ul>

          <section className="mt-8" aria-labelledby="desc">
            <h2 id="desc" className="text-lg font-semibold">{t.about}</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-600">{i.pick(p.description, p.descriptionBn)}</p>
          </section>
        </div>
      </div>

      <section id="reviews" className="mt-14 grid gap-8 lg:grid-cols-[1fr_380px]" aria-labelledby="reviews-title">
        <div>
          <h2 id="reviews-title" className="text-xl font-bold">{t.customerReviews}</h2>
          {reviews.length === 0 ? (
            <p className="mt-3 text-ink-600">{t.noReviewsBody}</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-2xl border border-line p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Stars value={r.rating} label={`${i.num(r.rating)} / ${i.num(5)}`} />
                    <time className="text-xs text-ink-400" dateTime={r.createdAt.toISOString()}>{i.date(r.createdAt)}</time>
                  </div>
                  {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
                  <p className="mt-1 text-ink-600">{r.body}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-ink-600">
                    <BadgeCheck className="size-3.5 text-brand-700" aria-hidden /> {r.userName} · {t.verified}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          {!user ? (
            <p className="rounded-2xl border border-line bg-canvas p-5 text-sm text-ink-600">
              <Link href={`/login?next=/product/${p.slug}`} className="font-semibold text-brand-700 hover:underline">{t.signIn}</Link> {t.signInToReview}
            </p>
          ) : eligibility?.eligible ? (
            <ReviewForm productId={p.id} />
          ) : (
            <p className="rounded-2xl border border-line bg-canvas p-5 text-sm text-ink-600">{eligibility?.alreadyReviewed ? t.alreadyReviewed : t.reviewAfterDelivery}</p>
          )}
        </div>
      </section>

      {related.items.length > 0 && (
        <section className="mt-14">
          <SectionHeading title={t.youMayLike} />
          <ProductGrid products={related.items} savedIds={saved} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5" />
        </section>
      )}
    </div>
  );
}
