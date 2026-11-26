"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple, BadgePercent, Carrot, Home, Info, Leaf, Mail, ShoppingBasket, Sprout } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ICONS = { home: Home, apple: Apple, carrot: Carrot, basket: ShoppingBasket, sprout: Sprout, leaf: Leaf, percent: BadgePercent, info: Info, mail: Mail };
const ICON_COLORS: Record<string, string> = { apple: "text-tomato-500", carrot: "text-orange-500", percent: "text-orange-500", leaf: "text-leaf-500", sprout: "text-leaf-500" };

export function NavLinks({ items }: { items: { href: string; label: string; icon: string }[] }) {
  const path = usePathname();
  return (
    <ul className="flex flex-1 items-center justify-between gap-1 xl:justify-start xl:gap-2">
      {items.map((it) => {
        const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
        const Icon = ICONS[it.icon as keyof typeof ICONS];
        return (
          <li key={it.href} className={it.icon === "info" || it.icon === "mail" ? "hidden xl:block" : undefined}>
            <Link
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-14 items-center gap-1.5 whitespace-nowrap px-1.5 text-[15px] font-medium transition-colors 2xl:px-3",
                active ? "font-semibold text-brand-700" : "text-ink-900 hover:text-brand-700",
              )}
            >
              <Icon className={cn("size-[18px]", active ? "text-brand-700" : ICON_COLORS[it.icon] ?? "text-ink-600")} aria-hidden />
              {it.label}
              {active && <span className="absolute inset-x-2 bottom-2 h-0.5 rounded-full bg-brand-700" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
