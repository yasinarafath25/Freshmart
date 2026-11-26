import Link from "next/link";
import { ArrowRight, BadgeCheck, Handshake, Headset, Leaf, Quote, ShieldCheck, Sparkles, Star, Sun, TrendingUp, Truck } from "lucide-react";
import { HeroCarousel, type Slide } from "@/components/store/HeroCarousel";
import { ProductGrid } from "@/components/store/ProductCard";
import { Newsletter } from "@/components/store/Newsletter";
import { SectionHeading, ButtonLink } from "@/components/ui";
import { getTestimonials, getWishlistIds, listCategories, listProducts } from "@/lib/services/catalog";
import { getSettings } from "@/lib/services/settings";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { coupons } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { getI18n } from "@/lib/i18n/server";

const TRUST_ICONS = [Leaf, ShieldCheck, Handshake, Headset];

export default async function HomePage() {
  const user = await getCurrentUser();
  const [settings, categories, featured, best, seasonal, organic, testimonials, saved, promo, i] = await Promise.all([
    getSettings(),
    listCategories(),
    listProducts({ featured: true, perPage: 5, sort: "popular" }),
    listProducts({ perPage: 10, sort: "popular", inStock: true }),
    listProducts({ seasonal: true, perPage: 5 }),
    listProducts({ organic: true, perPage: 4 }),
    getTestimonials(3),
    getWishlistIds(user?.id),
    getDb().query.coupons.findFirst({ where: and(eq(coupons.isPublic, true), eq(coupons.isActive, true), eq(coupons.type, "percent")), orderBy: desc(coupons.value) }),
    getI18n(),
  ]);
  const { d } = i;
  const h = d.home;
  const slides: Slide[] = [
    { title: d.hero.s1.title, accent: d.hero.s1.accent, subtitle: d.hero.s1.subtitle, cta: { href: "/shop", label: d.hero.s1.cta }, image: "/images/photos/banner-vegetable-basket.jpg", alt: "", seal: d.hero.seal as [string, string], photo: true, focus: "center 62%" },
    { title: d.hero.s2.title, accent: d.hero.s2.accent, subtitle: d.hero.s2.subtitle, cta: { href: "/fruits", label: d.hero.s2.cta }, image: "/images/photos/mango.jpg", alt: "", photo: true, focus: "center 40%" },
    { title: d.hero.s3.title, accent: d.hero.s3.accent, subtitle: d.hero.s3.subtitle, cta: { href: "/spices", label: d.hero.s3.cta }, image: "/images/photos/banner-spices-cooking.jpg", alt: "", photo: true },
  ];
  const gridMain = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5";

  return (
    <div className="pb-4">
      <div className="container-page pt-4 sm:pt-5">
        <HeroCarousel slides={slides} label={h.featured} />
      </div>

      {/* Category rail */}
      <section aria-label={h.shopByCategory} className="container-page mt-5">
        <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto rounded-[20px] bg-mint-50 p-3 sm:grid sm:grid-cols-4 sm:gap-0 sm:overflow-visible sm:p-2 lg:grid-cols-7">
          {categories.map((c, idx) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className={`group flex w-28 shrink-0 snap-start flex-col items-center rounded-2xl px-2 py-3 text-center transition hover:bg-white hover:shadow-card sm:w-auto ${idx > 0 ? "lg:border-l lg:border-line/80" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image ?? "/images/placeholder.svg"} alt="" width={72} height={72} loading="lazy" className="size-16 rounded-full border-2 border-white object-cover shadow-card transition group-hover:scale-105 sm:size-[72px]" />
              <span className="mt-2 text-sm font-semibold leading-tight text-ink-900">{i.name(c)}</span>
              <span className="mt-0.5 text-xs text-brand-700">{d.common.seeAll}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured + side promos */}
      <section className="container-page mt-10 grid gap-5 xl:grid-cols-[250px_1fr_250px]">
        <Link href="/shop" className="group relative order-2 flex min-h-56 flex-col justify-end overflow-hidden rounded-[20px] bg-gradient-to-br from-lime-400/50 via-mint-50 to-leaf-400/40 p-6 xl:order-1">
          <Truck className="absolute right-5 top-5 size-20 text-brand-700/80 transition group-hover:translate-x-1" aria-hidden />
          <h3 className="font-display text-2xl font-extrabold leading-tight text-brand-900">
            {h.freeDeliveryTitle[0]}
            <br />
            {h.freeDeliveryTitle[1]}
          </h3>
          <p className="mt-1 text-sm text-ink-900">{h.freeDeliveryOn(i.money(settings.freeDeliveryThreshold))}</p>
          <span className="mt-4 inline-flex w-fit items-center gap-1 rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white">
            {h.orderNow} <ArrowRight className="size-4" aria-hidden />
          </span>
        </Link>
        <div className="order-1 min-w-0 xl:order-2">
          <SectionHeading
            title={h.featured}
            icon={<Leaf className="size-6 text-leaf-500" aria-hidden />}
            action={
              <Link href="/shop" className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                {h.viewAllProducts} <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          />
          <ProductGrid products={featured.items} savedIds={saved} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 xl:grid-cols-3 2xl:grid-cols-5" />
        </div>
        <Link href="/offers" className="group relative order-3 flex min-h-56 flex-col overflow-hidden rounded-[20px] bg-brand-900 p-6 text-white">
          <span className="w-fit -rotate-3 rounded-md bg-sun-400 px-3 py-1 font-display text-sm font-bold text-brand-900">{h.specialOffer}</span>
          <p className="mt-4 font-display text-3xl font-extrabold leading-tight">{promo ? h.getOff(i.num(promo.value)) : h.weeklyDeals}</p>
          <p className="text-white/80">{promo ? h.withCode(promo.code) : h.onVeg}</p>
          <span className="mt-4 inline-flex w-fit items-center gap-1 rounded-lg bg-sun-400 px-3 py-2 text-sm font-semibold text-brand-900 transition group-hover:bg-sun-300">
            {h.shopNow} <ArrowRight className="size-4" aria-hidden />
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/photos/tomato.jpg" alt="" width={160} height={160} loading="lazy" className="absolute -bottom-6 -right-6 size-40 rounded-full border-4 border-white/20 object-cover" />
        </Link>
      </section>

      {/* Trust strip */}
      <section aria-label={h.trust[0].t} className="mt-10 bg-mint-50">
        <ul className="container-page grid grid-cols-2 gap-y-4 py-6 lg:grid-cols-4">
          {h.trust.map(({ t, d: desc }, idx) => {
            const Icon = TRUST_ICONS[idx];
            return (
              <li key={t} className={`flex items-center gap-3 px-2 lg:justify-center ${idx > 0 ? "lg:border-l lg:border-line" : ""}`}>
                <Icon className="size-8 shrink-0 text-brand-700" aria-hidden />
                <div>
                  <p className="text-[15px] font-semibold">{t}</p>
                  <p className="text-xs text-ink-600">{desc}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Organic promo */}
      {organic.items.length > 0 && (
        <section className="container-page mt-12">
          <div className="grid overflow-hidden rounded-[24px] border border-line bg-gradient-to-r from-white to-mint-50 lg:grid-cols-[1fr_1.6fr]">
            <div className="flex flex-col justify-center p-8 lg:p-10">
              <span className="flex w-fit items-center gap-1.5 rounded-full bg-lime-400 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-900">
                <BadgeCheck className="size-4" aria-hidden /> {h.organicBadge}
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-brand-900">{h.organicTitle}</h2>
              <p className="mt-3 text-ink-600">{h.organicBody}</p>
              <ButtonLink href="/organic" className="mt-6 w-fit">
                {h.shopOrganic} <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            </div>
            <div className="p-4 lg:p-6">
              <ProductGrid products={organic.items} savedIds={saved} className="grid grid-cols-2 gap-3 md:grid-cols-4" />
            </div>
          </div>
        </section>
      )}

      {/* Best sellers */}
      <section className="container-page mt-12">
        <SectionHeading
          title={h.bestSellers}
          icon={<TrendingUp className="size-6 text-tomato-500" aria-hidden />}
          action={
            <Link href="/shop?sort=popular" className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
              {h.seeMore} <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />
        <ProductGrid products={best.items} savedIds={saved} className={gridMain} />
      </section>

      {/* Discount banner */}
      <section className="container-page mt-12">
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-sun-400 to-sun-300 px-8 py-10 sm:px-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/photos/orange.jpg" alt="" width={960} height={640} loading="lazy" className="absolute inset-y-0 right-0 hidden h-full w-2/5 object-cover [mask-image:linear-gradient(to_right,transparent,black_35%)] md:block" />
          <div className="relative max-w-lg">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-900/80">
              <Sparkles className="size-4" aria-hidden /> {h.limitedTime}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-brand-900 sm:text-4xl">{h.savingsTitle}</h2>
            <p className="mt-2 text-brand-900/80">{h.savingsBody}</p>
            <ButtonLink href="/offers" className="mt-6">
              {h.viewOffers} <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Seasonal */}
      {seasonal.items.length > 0 && (
        <section className="container-page mt-12">
          <SectionHeading title={h.inSeason} icon={<Sun className="size-6 text-sun-400" aria-hidden />} />
          <ProductGrid products={seasonal.items} savedIds={saved} className={gridMain} />
        </section>
      )}

      {/* Testimonials — only real, approved reviews */}
      {testimonials.length > 0 && (
        <section className="container-page mt-12">
          <SectionHeading title={h.testimonials} icon={<Quote className="size-6 text-leaf-500" aria-hidden />} />
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.id} className="rounded-2xl border border-line bg-white p-6 shadow-card">
                <div className="flex gap-0.5" aria-label={`${i.num(t.rating)} / ${i.num(5)}`}>
                  {Array.from({ length: 5 }, (_, n) => (
                    <Star key={n} className={`size-4 ${n < t.rating ? "fill-sun-400 text-sun-400" : "text-line"}`} aria-hidden />
                  ))}
                </div>
                <blockquote className="mt-3 text-[15px] leading-relaxed text-ink-900">“{t.body}”</blockquote>
                <figcaption className="mt-4 text-sm text-ink-600">
                  <span className="font-semibold text-ink-900">{t.userName}</span> {h.on}{" "}
                  <Link href={`/product/${t.productSlug}`} className="text-brand-700 hover:underline">
                    {i.pick(t.productName, t.productNameBn)}
                  </Link>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <Newsletter />
    </div>
  );
}
