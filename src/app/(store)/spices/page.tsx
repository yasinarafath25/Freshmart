import type { Metadata } from "next";
import { CategoryContent } from "@/components/store/CategoryContent";
import type { SearchParams } from "@/components/store/CatalogView";

export const metadata: Metadata = { title: "Spices", alternates: { canonical: "/spices" } };

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <CategoryContent slug="spices" basePath="/spices" searchParams={await searchParams} />;
}
