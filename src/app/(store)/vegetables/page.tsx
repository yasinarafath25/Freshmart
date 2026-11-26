import type { Metadata } from "next";
import { CategoryContent } from "@/components/store/CategoryContent";
import type { SearchParams } from "@/components/store/CatalogView";

export const metadata: Metadata = { title: "Vegetables", alternates: { canonical: "/vegetables" } };

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <CategoryContent slug="vegetables" basePath="/vegetables" searchParams={await searchParams} />;
}
