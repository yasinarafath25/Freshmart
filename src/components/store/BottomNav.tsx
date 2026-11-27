"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingBasket, User } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils/cn";

/** Thumb-friendly navigation for phones (hidden on desktop). */
export function BottomNav({ cartCount, accountHref }: { cartCount: number; accountHref: string }) {
  const { d, num } = useI18n();
  const path = usePathname();
  const items = [
    { href: "/", label: d.nav.home, Icon: Home, active: path === "/" },
    { href: "/shop", label: d.nav.shop, Icon: LayoutGrid, active: path.startsWith("/shop") || path.startsWith("/category") },
    { href: "/search", label: d.nav.search, Icon: Search, active: path.startsWith("/search") },
    { href: "/cart", label: d.nav.cart, Icon: ShoppingBasket, active: path.startsWith("/cart") || path.startsWith("/checkout"), badge: cartCount },
    { href: accountHref, label: d.nav.account, Icon: User, active: path.startsWith("/account") || path === "/login" },
  ];
  return (
    <nav aria-label={d.header.menu} className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ href, label, Icon, active, badge }) => (
          <li key={label}>
            <Link
              href={href}
              data-cart-target={href === "/cart" ? "" : undefined}
              aria-current={active ? "page" : undefined}
              className={cn("relative flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", active ? "text-brand-700" : "text-ink-600")}
            >
              <span className={cn("grid h-7 w-12 place-items-center rounded-full transition", active && "bg-mint-50")}>
                <Icon className="size-[22px]" aria-hidden />
              </span>
              {label}
              {!!badge && badge > 0 && (
                <span className="absolute right-[calc(50%-22px)] top-1.5 grid min-w-[18px] place-items-center rounded-full bg-tomato-500 px-1 text-[10px] font-bold leading-[18px] text-white">
                  {badge > 99 ? "99+" : num(badge)}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
