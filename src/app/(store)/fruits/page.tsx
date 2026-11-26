import type { Metadata } from "next";
import { CategoryContent } from "@/components/store/CategoryContent";
import type { SearchParams } from "@/components/store/CatalogView";

export const metadata: Metadata = { title: "Fruits", alternates: { canonical: "/fruits" } };

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <CategoryContent slug="fruits" basePath="/fruits" searchParams={await searchParams} />;
}
