import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { requireUserPage } from "@/lib/auth/guards";
import { getWishlistProducts } from "@/lib/services/catalog";
import { getI18n } from "@/lib/i18n/server";
import { ProductGrid } from "@/components/store/ProductCard";
import { ButtonLink, EmptyState } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.account.wishlist, robots: { index: false } };
}

export default async function WishlistPage() {
  const user = await requireUserPage("/account/wishlist");
  const [items, { d }] = await Promise.all([getWishlistProducts(user.id), getI18n()]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{d.account.wishlist}</h1>
      {items.length === 0 ? (
        <EmptyState icon={<Heart className="size-7" />} title={d.account.wishlistEmpty} body={d.account.wishlistEmptyBody} action={<ButtonLink href="/shop">{d.account.browse}</ButtonLink>} />
      ) : (
        <ProductGrid products={items} savedIds={new Set(items.map((x) => x.id))} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4" />
      )}
    </div>
  );
}
