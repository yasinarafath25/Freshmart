import { notFound } from "next/navigation";
import { CatalogView, type SearchParams } from "./CatalogView";
import { getCategoryBySlug } from "@/lib/services/catalog";

export async function CategoryContent({ slug, basePath, searchParams }: { slug: string; basePath: string; searchParams: SearchParams }) {
  const c = await getCategoryBySlug(slug);
  if (!c) notFound();
  return <CatalogView basePath={basePath} searchParams={searchParams} fixed={{ categoryIds: c.ids }} hideCategoryFilter title={c.name} description={c.description} />;
}
