"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Check, Heart, Loader2, ShoppingCart } from "lucide-react";
import { addToCartAction } from "@/app/actions/cart";
import { toggleWishlistAction } from "@/app/actions/wishlist";
import { buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useI18n } from "@/lib/i18n/client";
import { toast } from "./Toaster";

export function AddToCartButton({
  variantId,
  quantity = 1,
  disabled,
  size = "md",
  className,
  productName,
}: {
  variantId: string | null;
  quantity?: number;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  productName?: string;
}) {
  const { d, num } = useI18n();
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  if (!variantId || disabled) {
    return (
      <button type="button" disabled className={buttonClass("secondary", size, cn("w-full", className))}>
        {d.product.outOfStock}
      </button>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await addToCartAction(variantId, quantity);
            if (res.ok) {
              setDone(true);
              setTimeout(() => setDone(false), 2000);
              toast({
                message: res.code === "capped" ? d.product.capped(num(res.quantity ?? 0)) : productName ? `${productName} — ${d.product.addedToast}` : d.product.addedToast,
                action: { href: "/cart", label: d.product.viewCart },
              });
            } else {
              toast({ tone: "error", message: res.code === "soldout" ? d.product.soldOutMsg : res.code === "unavailable" ? d.product.unavailable : d.product.invalid });
            }
          })
        }
        className={buttonClass(done ? "outline" : "primary", size, "w-full")}
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : done ? <Check className="size-4" aria-hidden /> : <ShoppingCart className="size-4" aria-hidden />}
        {done ? d.product.added : d.product.addToCart}
      </button>
    </div>
  );
}

export function WishlistButton({ productId, initial, className, withLabel }: { productId: string; initial: boolean; className?: string; withLabel?: boolean }) {
  const { d } = useI18n();
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? d.product.removeWishlist : d.product.addWishlist}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await toggleWishlistAction(productId);
          if (res.needsLogin) {
            toast({ tone: "error", message: d.product.loginForWishlist });
            router.push(`/login?next=${encodeURIComponent(pathname)}`);
          } else if (res.ok) setSaved(!!res.saved);
        });
      }}
      className={cn(
        withLabel
          ? buttonClass("secondary", "lg", "")
          : "grid size-9 place-items-center rounded-full bg-white/95 text-ink-600 shadow-card transition hover:text-tomato-500",
        className,
      )}
    >
      <Heart className={cn("size-[18px]", saved && "fill-tomato-500 text-tomato-500")} aria-hidden />
      {withLabel && <span>{saved ? d.product.saved : d.product.wishlist}</span>}
    </button>
  );
}
