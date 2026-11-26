import type { Metadata } from "next";
import { CatalogView, type SearchParams } from "@/components/store/CatalogView";

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const q = (await searchParams).q;
  return { title: q ? `Search: ${String(q).slice(0, 60)}` : "Search", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  return <CatalogView basePath="/search" searchParams={sp} title="Search results" />;
}
