import type { Metadata } from "next";
import { CatalogView, type SearchParams } from "@/components/store/CatalogView";

export const metadata: Metadata = { title: "Organic products", description: "Certified organic fruits, vegetables and groceries.", alternates: { canonical: "/organic" } };

export default async function OrganicPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <CatalogView basePath="/organic" searchParams={await searchParams} fixed={{ organic: true }} title="Organic" description="Grown without synthetic pesticides or fertilisers, from partner farms we know." />;
}
