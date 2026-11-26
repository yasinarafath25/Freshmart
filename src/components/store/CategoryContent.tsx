import { notFound } from "next/navigation";
import { CatalogView, type SearchParams } from "./CatalogView";
import { getCategoryBySlug } from "@/lib/services/catalog";
import { getI18n } from "@/lib/i18n/server";

export async function CategoryContent({ slug, basePath, searchParams }: { slug: string; basePath: string; searchParams: SearchParams }) {
  const [c, i] = await Promise.all([getCategoryBySlug(slug), getI18n()]);
  if (!c) notFound();
  return <CatalogView basePath={basePath} searchParams={searchParams} fixed={{ categoryIds: c.ids }} hideCategoryFilter title={i.name(c)} description={i.pick(c.description ?? "", c.descriptionBn) || null} />;
}
