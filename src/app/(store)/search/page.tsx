import type { Metadata } from "next";
import { CatalogView, type SearchParams } from "@/components/store/CatalogView";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const q = (await searchParams).q;
  const { d } = await getI18n();
  return { title: q ? `${d.nav.search}: ${String(q).slice(0, 60)}` : d.nav.search, robots: { index: false } };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { d } = await getI18n();
  return <CatalogView basePath="/search" searchParams={await searchParams} title={d.catalog.searchResults} />;
}
