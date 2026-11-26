import type { Metadata } from "next";
import { CategoryContent } from "@/components/store/CategoryContent";
import type { SearchParams } from "@/components/store/CatalogView";

export const metadata: Metadata = { title: "Groceries", alternates: { canonical: "/groceries" } };

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <CategoryContent slug="groceries" basePath="/groceries" searchParams={await searchParams} />;
}
