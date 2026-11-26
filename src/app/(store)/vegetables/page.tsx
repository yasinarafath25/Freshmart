import type { Metadata } from "next";
import { CategoryContent } from "@/components/store/CategoryContent";
import type { SearchParams } from "@/components/store/CatalogView";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.nav.vegetables, alternates: { canonical: "/vegetables" } };
}

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <CategoryContent slug="vegetables" basePath="/vegetables" searchParams={await searchParams} />;
}
