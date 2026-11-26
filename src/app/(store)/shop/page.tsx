import type { Metadata } from "next";
import { CatalogView, type SearchParams } from "@/components/store/CatalogView";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.catalog.allProducts, description: d.catalog.allProductsDesc, alternates: { canonical: "/shop" } };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { d } = await getI18n();
  return <CatalogView basePath="/shop" searchParams={await searchParams} title={d.catalog.allProducts} description={d.catalog.allProductsDesc} />;
}
