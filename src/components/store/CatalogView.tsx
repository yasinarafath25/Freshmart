import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch, SlidersHorizontal } from "lucide-react";
import { getWishlistIds, listCategories, listProducts, type ProductFilters, type SortKey } from "@/lib/services/catalog";
import { getSettings } from "@/lib/services/settings";
import { getCurrentUser } from "@/lib/auth/session";
import { ProductGrid } from "./ProductCard";
import { ButtonLink, EmptyState } from "@/components/ui";
import { toMinor } from "@/lib/utils/money";

export type SearchParams = Record<string, string | string[] | undefined>;

const SORTS: { value: SortKey; label: string }[] = [
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
];

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
    sort: SORTS.some((s) => s.value === sort) ? (sort as SortKey) : "popular",
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
  extraHidden,
}: {
  basePath: string;
  searchParams: SearchParams;
  fixed?: ProductFilters;
  title: string;
  description?: string | null;
  hideCategoryFilter?: boolean;
  extraHidden?: Record<string, string>;
}) {
  const f = parseFilters(searchParams);
  const user = await getCurrentUser();
  const [settings, categories, saved] = await Promise.all([getSettings(), listCategories(), getWishlistIds(user?.id)]);
  let categoryIds = fixed.categoryIds;
  if (!categoryIds && f.categorySlug) {
    const c = categories.find((x) => x.slug === f.categorySlug);
    if (c) categoryIds = [c.id, ...categories.filter((x) => x.parentId === c.id).map((x) => x.id)];
  }
  const result = await listProducts({ ...f, ...fixed, categoryIds, perPage: 24 });
  const cur = settings.currencySymbol;
  const activeFilters = !!(f.organic || f.inStock || f.onSale || f.minPrice || f.maxPrice || f.categorySlug);

  const filterForm = (
    <form action={basePath} method="get" className="space-y-6">
      {f.q && <input type="hidden" name="q" value={f.q} />}
      {extraHidden && Object.entries(extraHidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <input type="hidden" name="sort" value={f.sort} />
      {!hideCategoryFilter && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Category</legend>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="category" value="" defaultChecked={!f.categorySlug} className="accent-brand-700" /> All
            </label>
            {categories.map((c) => (
              <label key={c.id} className={`flex items-center gap-2 text-sm ${c.parentId ? "pl-5" : ""}`}>
                <input type="radio" name="category" value={c.slug} defaultChecked={f.categorySlug === c.slug} className="accent-brand-700" />
                {c.name} <span className="text-ink-400">({c.productCount})</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Price ({cur})</legend>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`min-${basePath}`}>Minimum price</label>
          <input id={`min-${basePath}`} name="min" type="number" min={0} inputMode="numeric" placeholder="Min" defaultValue={f.minPrice !== undefined ? f.minPrice / 100 : ""} className="h-10 w-full rounded-lg border border-line px-3 text-sm" />
          <span className="text-ink-400">–</span>
          <label className="sr-only" htmlFor={`max-${basePath}`}>Maximum price</label>
          <input id={`max-${basePath}`} name="max" type="number" min={0} inputMode="numeric" placeholder="Max" defaultValue={f.maxPrice !== undefined ? f.maxPrice / 100 : ""} className="h-10 w-full rounded-lg border border-line px-3 text-sm" />
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">Show only</legend>
        {!fixed.organic && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="organic" value="1" defaultChecked={!!f.organic} className="size-4 accent-brand-700" /> Organic
          </label>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="instock" value="1" defaultChecked={!!f.inStock} className="size-4 accent-brand-700" /> In stock
        </label>
        {!fixed.onSale && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="sale" value="1" defaultChecked={!!f.onSale} className="size-4 accent-brand-700" /> On sale
          </label>
        )}
      </fieldset>
      <div className="flex gap-2">
        <button className="h-10 flex-1 rounded-xl bg-brand-700 text-sm font-semibold text-white hover:bg-brand-800">Apply filters</button>
        {activeFilters && (
          <Link href={hrefWith(basePath, { q: f.q }, {})} className="grid h-10 place-items-center rounded-xl border border-line px-3 text-sm font-medium hover:border-brand-600">
            Clear
          </Link>
        )}
      </div>
    </form>
  );

  return (
    <div className="container-page py-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-600">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-brand-700">Home</Link>
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
          <div className="sticky top-4 rounded-2xl border border-line bg-white p-5 shadow-card">{filterForm}</div>
        </aside>
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-600" aria-live="polite">
              <span className="font-semibold text-ink-900">{result.total}</span> product{result.total === 1 ? "" : "s"}
              {f.q && (
                <>
                  {" "}for “<span className="font-semibold text-ink-900">{f.q}</span>”
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <details className="relative lg:hidden">
                <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-line px-3 text-sm font-medium">
                  <SlidersHorizontal className="size-4" aria-hidden /> Filters
                </summary>
                <div className="absolute right-0 z-20 mt-2 w-[min(88vw,320px)] rounded-2xl border border-line bg-white p-5 shadow-pop">{filterForm}</div>
              </details>
              <div className="flex flex-wrap gap-1" role="group" aria-label="Sort products">
                <span className="sr-only">Sort by</span>
                <SortLinks basePath={basePath} sp={searchParams} current={f.sort!} />
              </div>
            </div>
          </div>

          {result.items.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-7" />}
              title="No products found"
              body={f.q ? "Try a different spelling or a more general word, like “apple” or “dal”." : "Try removing some filters to see more products."}
              action={<ButtonLink href="/shop" variant="secondary">Browse all products</ButtonLink>}
            />
          ) : (
            <ProductGrid products={result.items} currency={cur} savedIds={saved} className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4" />
          )}

          {result.pages > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1">
              {result.page > 1 && (
                <Link href={hrefWith(basePath, searchParams, { page: String(result.page - 1) })} className="grid size-10 place-items-center rounded-xl border border-line hover:border-brand-600" aria-label="Previous page">
                  <ChevronLeft className="size-4" />
                </Link>
              )}
              {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={hrefWith(basePath, searchParams, { page: n === 1 ? undefined : String(n) })}
                  aria-current={n === result.page ? "page" : undefined}
                  className={`grid size-10 place-items-center rounded-xl text-sm font-semibold ${n === result.page ? "bg-brand-700 text-white" : "border border-line hover:border-brand-600"}`}
                >
                  {n}
                </Link>
              ))}
              {result.page < result.pages && (
                <Link href={hrefWith(basePath, searchParams, { page: String(result.page + 1) })} className="grid size-10 place-items-center rounded-xl border border-line hover:border-brand-600" aria-label="Next page">
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

function SortLinks({ basePath, sp, current }: { basePath: string; sp: SearchParams; current: SortKey }) {
  return (
    <details className="relative">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-line px-3 text-sm font-medium">
        Sort: {SORTS.find((s) => s.value === current)?.label}
      </summary>
      <ul className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-line bg-white p-1.5 shadow-pop">
        {SORTS.map((s) => (
          <li key={s.value}>
            <Link
              href={hrefWith(basePath, sp, { sort: s.value === "popular" ? undefined : s.value, page: undefined })}
              className={`block rounded-lg px-3 py-2 text-sm hover:bg-mint-50 ${s.value === current ? "font-semibold text-brand-700" : ""}`}
            >
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
