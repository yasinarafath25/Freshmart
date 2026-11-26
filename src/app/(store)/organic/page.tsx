import type { Metadata } from "next";
import { CatalogView, type SearchParams } from "@/components/store/CatalogView";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.catalog.organic, description: d.catalog.organicDesc, alternates: { canonical: "/organic" } };
}

export default async function OrganicPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { d } = await getI18n();
  return <CatalogView basePath="/organic" searchParams={await searchParams} fixed={{ organic: true }} title={d.catalog.organic} description={d.catalog.organicDesc} />;
}
