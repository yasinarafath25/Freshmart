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
import { formatMoney } from "@/lib/utils/money";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [settings, categories, featured, best, seasonal, organic, testimonials, saved, promo] = await Promise.all([
    getSettings(),
    listCategories(),
    listProducts({ featured: true, perPage: 5, sort: "popular" }),
    listProducts({ perPage: 10, sort: "popular", inStock: true }),
    listProducts({ seasonal: true, perPage: 5 }),
    listProducts({ organic: true, perPage: 4 }),
    getTestimonials(3),
    getWishlistIds(user?.id),
    getDb().query.coupons.findFirst({ where: and(eq(coupons.isPublic, true), eq(coupons.isActive, true), eq(coupons.type, "percent")), orderBy: desc(coupons.value) }),
  ]);
  const cur = settings.currencySymbol;
  const slides: Slide[] = [
    { title: "Fresh Fruits & Vegetables", accent: "Directly from Nature", subtitle: "Healthy Food. Happy Life.", cta: { href: "/shop", label: "Shop Now" }, image: "/images/photos/banner-vegetable-basket.jpg", alt: "A market stall piled with fresh vegetables", seal: "100% Fresh", photo: true, focus: "center 35%" },
    { title: "Seasonal Fruits", accent: "Picked at Peak Ripeness", subtitle: "Himsagar mangoes, melons and more — only in season.", cta: { href: "/fruits", label: "Explore Fruits" }, image: "/images/photos/mango.jpg", alt: "Ripe Himsagar mangoes", photo: true },
    { title: "Spices & Pantry", accent: "Authentic Flavour", subtitle: "Turmeric, chili, cumin, dal and daily essentials.", cta: { href: "/spices", label: "Shop Spices" }, image: "/images/photos/banner-spices-cooking.jpg", alt: "Colourful mounds of ground spices", photo: true },
  ];

  return (
    <div className="pb-4">
      <div className="container-page pt-4 sm:pt-5">
        <HeroCarousel slides={slides} />
      </div>

      {/* Category rail */}
      <section aria-label="Shop by category" className="container-page mt-5">
        <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto rounded-[20px] bg-mint-50 p-3 sm:grid sm:grid-cols-4 sm:gap-0 sm:overflow-visible sm:p-2 lg:grid-cols-7">
          {categories.map((c, idx) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className={`group flex w-28 shrink-0 snap-start flex-col items-center rounded-2xl px-2 py-3 text-center transition hover:bg-white hover:shadow-card sm:w-auto ${idx > 0 ? "lg:border-l lg:border-line/80" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image ?? "/images/placeholder.svg"} alt="" width={72} height={72} loading="lazy" className="size-16 rounded-full border-2 border-white object-cover shadow-card transition group-hover:scale-105 sm:size-[72px]" />
              <span className="mt-2 text-sm font-semibold text-ink-900">{c.name}</span>
              <span className="text-xs text-brand-700">See all →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured + side promos */}
      <section className="container-page mt-10 grid gap-5 xl:grid-cols-[250px_1fr_250px]">
        <Link href="/shop" className="group relative order-2 flex min-h-56 flex-col justify-end overflow-hidden rounded-[20px] bg-gradient-to-br from-lime-400/50 via-mint-50 to-leaf-400/40 p-6 xl:order-1">
          <Truck className="absolute right-5 top-5 size-20 text-brand-700/80 transition group-hover:translate-x-1" aria-hidden />
          <h3 className="font-display text-2xl font-extrabold leading-tight text-brand-900">
            Fast &amp; Free
            <br />
            Home Delivery
          </h3>
          <p className="mt-1 text-sm text-ink-900">On orders over {formatMoney(settings.freeDeliveryThreshold, cur)}</p>
          <span className="mt-4 inline-flex w-fit items-center gap-1 rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white">
            Order Now <ArrowRight className="size-4" aria-hidden />
          </span>
        </Link>
        <div className="order-1 min-w-0 xl:order-2">
          <SectionHeading
            title="Featured Products"
            icon={<Leaf className="size-6 text-leaf-500" aria-hidden />}
            action={
              <Link href="/shop" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                View All Products <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          />
          <ProductGrid products={featured.items} currency={cur} savedIds={saved} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 xl:grid-cols-3 2xl:grid-cols-5" />
        </div>
        <Link href="/offers" className="group relative order-3 flex min-h-56 flex-col overflow-hidden rounded-[20px] bg-brand-900 p-6 text-white">
          <span className="w-fit -rotate-3 rounded-md bg-sun-400 px-3 py-1 font-display text-sm font-bold text-brand-900">Special Offer</span>
          <p className="mt-4 font-display text-3xl font-extrabold leading-tight">
            {promo ? `Get ${promo.value}% OFF` : "Weekly Deals"}
          </p>
          <p className="text-white/80">{promo ? `with code ${promo.code}` : "on fresh vegetables"}</p>
          <span className="mt-4 inline-flex w-fit items-center gap-1 rounded-lg bg-sun-400 px-3 py-2 text-sm font-semibold text-brand-900 transition group-hover:bg-sun-300">
            Shop Now <ArrowRight className="size-4" aria-hidden />
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/photos/tomato.jpg" alt="" width={160} height={160} className="absolute -bottom-6 -right-6 size-40 rounded-full border-4 border-white/20 object-cover" />
        </Link>
      </section>

      {/* Trust strip */}
      <section aria-label="Why shop with us" className="mt-10 bg-mint-50">
        <ul className="container-page grid grid-cols-2 gap-y-4 py-6 lg:grid-cols-4">
          {[
            { Icon: Leaf, t: "100% Fresh & Natural", d: "Quality-checked daily" },
            { Icon: ShieldCheck, t: "Secure Payment", d: "Cash on delivery available" },
            { Icon: Handshake, t: "Trusted by Locals", d: "Sourced from nearby farms" },
            { Icon: Headset, t: "Dedicated Support", d: "We’re here to help" },
          ].map(({ Icon, t, d }, i) => (
            <li key={t} className={`flex items-center gap-3 px-2 lg:justify-center ${i > 0 ? "lg:border-l lg:border-line" : ""}`}>
              <Icon className="size-8 shrink-0 text-brand-700" aria-hidden />
              <div>
                <p className="text-[15px] font-semibold">{t}</p>
                <p className="text-xs text-ink-600">{d}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Organic promo */}
      {organic.items.length > 0 && (
        <section className="container-page mt-12">
          <div className="grid overflow-hidden rounded-[24px] border border-line bg-gradient-to-r from-white to-mint-50 lg:grid-cols-[1fr_1.6fr]">
            <div className="flex flex-col justify-center p-8 lg:p-10">
              <span className="flex w-fit items-center gap-1.5 rounded-full bg-lime-400 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-900">
                <BadgeCheck className="size-4" aria-hidden /> Certified Organic
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-brand-900">Grown without chemicals. Packed with goodness.</h2>
              <p className="mt-3 text-ink-600">Our organic range comes from partner farms that avoid synthetic pesticides and fertilisers.</p>
              <ButtonLink href="/organic" className="mt-6 w-fit">
                Shop organic <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            </div>
            <div className="p-4 lg:p-6">
              <ProductGrid products={organic.items} currency={cur} savedIds={saved} className="grid grid-cols-2 gap-3 md:grid-cols-4" />
            </div>
          </div>
        </section>
      )}

      {/* Best sellers */}
      <section className="container-page mt-12">
        <SectionHeading
          title="Best Sellers"
          icon={<TrendingUp className="size-6 text-tomato-500" aria-hidden />}
          action={
            <Link href="/shop?sort=popular" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
              See more <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />
        <ProductGrid products={best.items} currency={cur} savedIds={saved} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5" />
      </section>

      {/* Discount banner */}
      <section className="container-page mt-12">
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-sun-400 to-sun-300 px-8 py-10 sm:px-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/photos/orange.jpg" alt="" width={960} height={640} loading="lazy" className="absolute inset-y-0 right-0 hidden h-full w-2/5 object-cover [mask-image:linear-gradient(to_right,transparent,black_35%)] md:block" />
          <div className="relative max-w-lg">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-900/80">
              <Sparkles className="size-4" aria-hidden /> Limited time
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-brand-900 sm:text-4xl">Fresh savings on your weekly basket</h2>
            <p className="mt-2 text-brand-900/80">Discounted produce and coupon codes, updated every week.</p>
            <ButtonLink href="/offers" className="mt-6">
              View all offers <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Seasonal */}
      {seasonal.items.length > 0 && (
        <section className="container-page mt-12">
          <SectionHeading title="In Season Now" icon={<Sun className="size-6 text-sun-400" aria-hidden />} />
          <ProductGrid products={seasonal.items} currency={cur} savedIds={saved} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5" />
        </section>
      )}

      {/* Testimonials — only real, approved reviews */}
      {testimonials.length > 0 && (
        <section className="container-page mt-12" aria-labelledby="testimonials">
          <SectionHeading title="What our customers say" icon={<Quote className="size-6 text-leaf-500" aria-hidden />} />
          <span id="testimonials" className="sr-only">
            Customer testimonials
          </span>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.id} className="rounded-2xl border border-line bg-white p-6 shadow-card">
                <div className="flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`size-4 ${i < t.rating ? "fill-sun-400 text-sun-400" : "text-line"}`} aria-hidden />
                  ))}
                </div>
                <blockquote className="mt-3 text-[15px] leading-relaxed text-ink-900">“{t.body}”</blockquote>
                <figcaption className="mt-4 text-sm text-ink-600">
                  <span className="font-semibold text-ink-900">{t.userName}</span> on{" "}
                  <Link href={`/product/${t.productSlug}`} className="text-brand-700 hover:underline">
                    {t.productName}
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
