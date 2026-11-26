import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { requireUserPage } from "@/lib/auth/guards";
import { getWishlistProducts } from "@/lib/services/catalog";
import { getSettings } from "@/lib/services/settings";
import { ProductGrid } from "@/components/store/ProductCard";
import { ButtonLink, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const user = await requireUserPage("/account/wishlist");
  const [items, settings] = await Promise.all([getWishlistProducts(user.id), getSettings()]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wishlist</h1>
      {items.length === 0 ? (
        <EmptyState icon={<Heart className="size-7" />} title="Your wishlist is empty" body="Tap the heart on any product to save it for later." action={<ButtonLink href="/shop">Browse products</ButtonLink>} />
      ) : (
        <ProductGrid products={items} currency={settings.currencySymbol} savedIds={new Set(items.map((i) => i.id))} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4" />
      )}
    </div>
  );
}
