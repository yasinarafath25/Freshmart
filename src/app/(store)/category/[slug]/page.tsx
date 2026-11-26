import type { Metadata } from "next";
import type { SearchParams } from "@/components/store/CatalogView";
import { CategoryContent } from "@/components/store/CategoryContent";
import { getCategoryBySlug } from "@/lib/services/catalog";
import { getI18n } from "@/lib/i18n/server";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [c, i] = await Promise.all([getCategoryBySlug((await params).slug), getI18n()]);
  if (!c) return { title: i.d.errors.notFoundTitle };
  return { title: i.name(c), description: i.pick(c.description ?? "", c.descriptionBn) || undefined, alternates: { canonical: `/category/${c.slug}` } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  return <CategoryContent slug={slug} basePath={`/category/${slug}`} searchParams={await searchParams} />;
}
