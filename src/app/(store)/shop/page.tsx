import type { Metadata } from "next";
import { CatalogView, type SearchParams } from "@/components/store/CatalogView";

export const metadata: Metadata = { title: "Shop all products", alternates: { canonical: "/shop" } };

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <CatalogView basePath="/shop" searchParams={await searchParams} title="All Products" description="Fresh produce, groceries and pantry staples — delivered to your door." />;
}
