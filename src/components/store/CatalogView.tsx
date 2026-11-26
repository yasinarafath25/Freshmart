import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch, SlidersHorizontal, X } from "lucide-react";
import { getWishlistIds, listCategories, listProducts, type ProductFilters, type SortKey } from "@/lib/services/catalog";
import { getSettings } from "@/lib/services/settings";
import { getCurrentUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { ProductGrid } from "./ProductCard";
import { ButtonLink, EmptyState } from "@/components/ui";
import { toMinor } from "@/lib/utils/money";

export type SearchParams = Record<string, string | string[] | undefined>;

const SORT_KEYS: SortKey[] = ["popular", "newest", "price_asc", "price_desc", "name"];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseFilters(sp: SearchParams): ProductFilters & { categorySlug?: string } {
  const sort = one(sp.sort);
  const min = one(sp.min);
  const max = one(sp.max);
  const page = Number(one(sp.page) ?? 1);
  return {
    q: one(sp.q)?.trim().slice(0, 80) || undefined,
    categorySlug: one(sp.category) || undefined,
    organic: one(sp.organic) === "1" || undefined,
    inStock: one(sp.instock) === "1" || undefined,
    onSale: one(sp.sale) === "1" || undefined,
    sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : "popular",
    minPrice: min && Number.isFinite(Number(min)) ? toMinor(min) : undefined,
    maxPrice: max && Number.isFinite(Number(max)) ? toMinor(max) : undefined,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

function hrefWith(basePath: string, sp: SearchParams, patch: Record<string, string | undefined>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const s = one(v);
    if (s) u.set(k, s);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) u.delete(k);
    else u.set(k, v);
  }
  const qs = u.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export async function CatalogView({
  basePath,
  searchParams,
  fixed = {},
  title,
  description,
  hideCategoryFilter,
}: {
  basePath: string;
  searchParams: SearchParams;
  fixed?: ProductFilters;
  title: string;
  description?: string | null;
  hideCategoryFilter?: boolean;
}) {
  const f = parseFilters(searchParams);
  const user = await getCurrentUser();
  const [settings, categories, saved, i] = await Promise.all([getSettings(), listCategories(), getWishlistIds(user?.id), getI18n()]);
  const c = i.d.catalog;
  let categoryIds = fixed.categoryIds;
  if (!categoryIds && f.categorySlug) {
    const cat = categories.find((x) => x.slug === f.categorySlug);
    if (cat) categoryIds = [cat.id, ...categories.filter((x) => x.parentId === cat.id).map((x) => x.id)];
  }
  const result = await listProducts({ ...f, ...fixed, categoryIds, perPage: 24 });
  const activeCat = categories.find((x) => x.slug === f.categorySlug);

  // Removable chips for active filters
  const chips: { label: string; href: string }[] = [];
  if (activeCat && !hideCategoryFilter) chips.push({ label: i.name(activeCat), href: hrefWith(basePath, searchParams, { category: undefined, page: undefined }) });
  if (f.organic && !fixed.organic) chips.push({ label: c.organic, href: hrefWith(basePath, searchParams, { organic: undefined, page: undefined }) });
  if (f.inStock) chips.push({ label: c.inStock, href: hrefWith(basePath, searchParams, { instock: undefined, page: undefined }) });
  if (f.onSale && !fixed.onSale) chips.push({ label: c.onSale, href: hrefWith(basePath, searchParams, { sale: undefined, page: undefined }) });
  if (f.minPrice !== undefined) chips.push({ label: `≥ ${i.money(f.minPrice)}`, href: hrefWith(basePath, searchParams, { min: undefined, page: undefined }) });
  if (f.maxPrice !== undefined) chips.push({ label: `≤ ${i.money(f.maxPrice)}`, href: hrefWith(basePath, searchParams, { max: undefined, page: undefined }) });

  const filterForm = (idPrefix: string) => (
    <form action={basePath} method="get" className="space-y-6">
      {f.q && <input type="hidden" name="q" value={f.q} />}
      <input type="hidden" name="sort" value={f.sort} />
      {!hideCategoryFilter && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{c.category}</legend>
          <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="category" value="" defaultChecked={!f.categorySlug} className="accent-brand-700" /> {c.all}
            </label>
            {categories.map((cat) => (
              <label key={cat.id} className={`flex items-center gap-2 text-sm ${cat.parentId ? "pl-5" : ""}`}>
                <input type="radio" name="category" value={cat.slug} defaultChecked={f.categorySlug === cat.slug} className="accent-brand-700" />
                {i.name(cat)} <span className="text-ink-400">({i.num(cat.productCount)})</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{c.price(settings.currencySymbol)}</legend>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`${idPrefix}-min`}>{c.minPrice}</label>
          <input id={`${idPrefix}-min`} name="min" type="number" min={0} inputMode="numeric" placeholder={c.min} defaultValue={f.minPrice !== undefined ? f.minPrice / 100 : ""} className="h-10 w-full rounded-lg border border-line px-3 text-sm" />
          <span className="text-ink-400">–</span>
          <label className="sr-only" htmlFor={`${idPrefix}-max`}>{c.maxPrice}</label>
          <input id={`${idPrefix}-max`} name="max" type="number" min={0} inputMode="numeric" placeholder={c.max} defaultValue={f.maxPrice !== undefined ? f.maxPrice / 100 : ""} className="h-10 w-full rounded-lg border border-line px-3 text-sm" />
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">{c.showOnly}</legend>
        {!fixed.organic && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="organic" value="1" defaultChecked={!!f.organic} className="size-4 accent-brand-700" /> {c.organic}
          </label>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="instock" value="1" defaultChecked={!!f.inStock} className="size-4 accent-brand-700" /> {c.inStock}
        </label>
        {!fixed.onSale && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="sale" value="1" defaultChecked={!!f.onSale} className="size-4 accent-brand-700" /> {c.onSale}
          </label>
        )}
      </fieldset>
      <div className="flex gap-2">
        <button className="h-11 flex-1 rounded-xl bg-brand-700 text-sm font-semibold text-white hover:bg-brand-800">{c.apply}</button>
        {chips.length > 0 && (
          <Link href={hrefWith(basePath, { q: f.q }, {})} className="grid h-11 place-items-center rounded-xl border border-line px-4 text-sm font-medium hover:border-brand-600">
            {c.clear}
          </Link>
        )}
      </div>
    </form>
  );

  return (
    <div className="container-page py-6 sm:py-8">
      <nav aria-label={c.breadcrumb} className="text-sm text-ink-600">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-brand-700">{i.d.common.home}</Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-medium text-ink-900">{title}</li>
        </ol>
      </nav>
      <div className="mt-3 flex flex-col gap-1">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-ink-600">{description}</p>}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-4 rounded-2xl border border-line bg-white p-5 shadow-card">{filterForm("d")}</div>
        </aside>
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-600" aria-live="polite">
              <span className="font-semibold text-ink-900">{c.count(i.num(result.total), result.total)}</span>
              {f.q && (
                <>
                  {" "}{c.forQuery} “<span className="font-semibold text-ink-900">{f.q}</span>”
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <details className="relative lg:hidden">
                <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-medium">
                  <SlidersHorizontal className="size-4" aria-hidden /> {c.filters}
                  {chips.length > 0 && <span className="grid size-5 place-items-center rounded-full bg-brand-700 text-[11px] font-bold text-white">{i.num(chips.length)}</span>}
                </summary>
                <div className="absolute right-0 z-20 mt-2 w-[min(88vw,320px)] rounded-2xl border border-line bg-white p-5 shadow-pop">{filterForm("m")}</div>
              </details>
              <details className="relative">
                <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-medium">
                  {c.sortBy}: {c.sort[f.sort!]}
                </summary>
                <ul className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-line bg-white p-1.5 shadow-pop">
                  {SORT_KEYS.map((s) => (
                    <li key={s}>
                      <Link
                        href={hrefWith(basePath, searchParams, { sort: s === "popular" ? undefined : s, page: undefined })}
                        className={`block rounded-lg px-3 py-2 text-sm hover:bg-mint-50 ${s === f.sort ? "font-semibold text-brand-700" : ""}`}
                      >
                        {c.sort[s]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </div>

          {chips.length > 0 && (
            <ul className="mb-4 flex flex-wrap gap-2">
              {chips.map((ch) => (
                <li key={ch.label}>
                  <Link href={ch.href} className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-3 py-1 text-sm font-medium text-brand-700 hover:bg-brand-100">
                    {ch.label} <X className="size-3.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {result.items.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-7" />}
              title={c.noResults}
              body={f.q ? c.noResultsQ : c.noResultsF}
              action={<ButtonLink href="/shop" variant="secondary">{c.browseAll}</ButtonLink>}
            />
          ) : (
            <ProductGrid products={result.items} savedIds={saved} className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4" />
          )}

          {result.pages > 1 && (
            <nav aria-label={c.pagination} className="mt-8 flex items-center justify-center gap-1">
              {result.page > 1 && (
                <Link href={hrefWith(basePath, searchParams, { page: String(result.page - 1) })} className="grid size-11 place-items-center rounded-xl border border-line hover:border-brand-600" aria-label={c.prev}>
                  <ChevronLeft className="size-4" />
                </Link>
              )}
              {Array.from({ length: result.pages }, (_, n) => n + 1).map((n) => (
                <Link
                  key={n}
                  href={hrefWith(basePath, searchParams, { page: n === 1 ? undefined : String(n) })}
                  aria-current={n === result.page ? "page" : undefined}
                  className={`grid size-11 place-items-center rounded-xl text-sm font-semibold ${n === result.page ? "bg-brand-700 text-white" : "border border-line hover:border-brand-600"}`}
                >
                  {i.num(n)}
                </Link>
              ))}
              {result.page < result.pages && (
                <Link href={hrefWith(basePath, searchParams, { page: String(result.page + 1) })} className="grid size-11 place-items-center rounded-xl border border-line hover:border-brand-600" aria-label={c.next}>
                  <ChevronRight className="size-4" />
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
