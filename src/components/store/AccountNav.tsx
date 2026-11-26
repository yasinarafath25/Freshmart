"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, MapPin, Package, UserRound } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const LINKS = [
  { href: "/account", label: "Overview", Icon: LayoutDashboard },
  { href: "/account/orders", label: "My orders", Icon: Package },
  { href: "/account/wishlist", label: "Wishlist", Icon: Heart },
  { href: "/account/addresses", label: "Addresses", Icon: MapPin },
  { href: "/account/profile", label: "Profile & security", Icon: UserRound },
];

export function AccountNav() {
  const path = usePathname();
  return (
    <nav aria-label="Account" className="no-scrollbar -mx-1 mt-3 flex gap-1 overflow-x-auto lg:flex-col">
      {LINKS.map(({ href, label, Icon }) => {
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
