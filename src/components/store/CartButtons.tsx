"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Check, Heart, Loader2, ShoppingCart } from "lucide-react";
import { addToCartAction } from "@/app/actions/cart";
import { toggleWishlistAction } from "@/app/actions/wishlist";
import { buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

export function AddToCartButton({
  variantId,
  quantity = 1,
  disabled,
  size = "md",
  className,
  label = "Add to Cart",
}: {
  variantId: string | null;
  quantity?: number;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<{ ok: boolean; message?: string } | null>(null);

  if (!variantId || disabled) {
    return (
      <button type="button" disabled className={buttonClass("secondary", size, cn("w-full", className))}>
        Out of stock
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
            setState(res);
            setTimeout(() => setState(null), 2200);
          })
        }
        className={buttonClass(state?.ok ? "outline" : "primary", size, "w-full")}
        aria-live="polite"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : state?.ok ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <ShoppingCart className="size-4" aria-hidden />
        )}
        {state?.ok ? "Added" : label}
      </button>
      {state && state.message && state.message !== "Added to cart" && (
        <p className={cn("mt-1.5 text-xs", state.ok ? "text-ink-600" : "text-tomato-600")} role="status">
          {state.message}
        </p>
      )}
    </div>
  );
}

export function WishlistButton({ productId, initial, className, withLabel }: { productId: string; initial: boolean; className?: string; withLabel?: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await toggleWishlistAction(productId);
          if (res.needsLogin) router.push(`/login?next=${encodeURIComponent(pathname)}`);
          else if (res.ok) setSaved(!!res.saved);
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
      {withLabel && <span>{saved ? "Saved" : "Wishlist"}</span>}
    </button>
  );
}
