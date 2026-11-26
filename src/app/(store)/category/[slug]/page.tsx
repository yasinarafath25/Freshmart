import type { Metadata } from "next";
import type { SearchParams } from "@/components/store/CatalogView";
import { CategoryContent } from "@/components/store/CategoryContent";
import { getCategoryBySlug } from "@/lib/services/catalog";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCategoryBySlug((await params).slug);
  if (!c) return { title: "Category not found" };
  return { title: c.name, description: c.description ?? undefined, alternates: { canonical: `/category/${c.slug}` } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  return <CategoryContent slug={slug} basePath={`/category/${slug}`} searchParams={await searchParams} />;
}

