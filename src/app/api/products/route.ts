import { NextResponse, type NextRequest } from "next/server";
import { parseFilters } from "@/components/store/CatalogView";
import { listCategories, listProducts } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

/** Public product search JSON (for future mobile apps). */
export async function GET(req: NextRequest) {
  const sp = Object.fromEntries(req.nextUrl.searchParams);
  const f = parseFilters(sp);
  let categoryIds: string[] | undefined;
  if (f.categorySlug) {
    const cats = await listCategories();
    const c = cats.find((x) => x.slug === f.categorySlug);
    if (!c) return NextResponse.json({ data: { items: [], total: 0, page: 1, pages: 1 } });
    categoryIds = [c.id, ...cats.filter((x) => x.parentId === c.id).map((x) => x.id)];
  }
  const res = await listProducts({ ...f, categoryIds, perPage: Math.min(Number(sp.perPage) || 24, 60) });
  return NextResponse.json({ data: res }, { headers: { "Cache-Control": "public, max-age=60" } });
}
