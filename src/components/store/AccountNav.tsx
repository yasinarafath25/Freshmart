"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, MapPin, Package, UserRound } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useI18n } from "@/lib/i18n/client";

export function AccountNav() {
  const { d } = useI18n();
  const path = usePathname();
  const links = [
    { href: "/account", label: d.account.overview, Icon: LayoutDashboard },
    { href: "/account/orders", label: d.account.orders, Icon: Package },
    { href: "/account/wishlist", label: d.account.wishlist, Icon: Heart },
    { href: "/account/addresses", label: d.account.addresses, Icon: MapPin },
    { href: "/account/profile", label: d.account.profile, Icon: UserRound },
  ];
  return (
    <nav aria-label={d.nav.account} className="no-scrollbar -mx-1 mt-3 flex gap-1 overflow-x-auto lg:flex-col">
      {links.map(({ href, label, Icon }) => {
        const active = href === "/account" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active ? "bg-mint-50 text-brand-700" : "text-ink-600 hover:bg-canvas hover:text-ink-900",
            )}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
