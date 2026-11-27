"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3, Bell, Boxes, CreditCard, ExternalLink, FolderTree, Inbox, LayoutDashboard, LogOut, Menu, Package, Settings, ShieldCheck, ShoppingCart,
  Star, TicketPercent, Truck, UserCog, Users, X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LeafMark } from "@/components/store/Logo";
import { LangSwitch } from "@/components/store/LangSwitch";
import { useI18n } from "@/lib/i18n/client";
import { NAV_GROUPS } from "./nav";

const ICONS = {
  dashboard: LayoutDashboard, orders: ShoppingCart, products: Package, categories: FolderTree, inventory: Boxes, customers: Users, messages: Inbox,
  reviews: Star, coupons: TicketPercent, delivery: Truck, payments: CreditCard, reports: BarChart3, settings: Settings, users: UserCog, roles: ShieldCheck,
};

type NavLink = { href: string; label: string; labelBn: string; icon: string; group: string; badge: number };

export function AdminShell({
  links,
  user,
  storeName,
  pendingOrders,
  logout,
  children,
}: {
  links: NavLink[];
  user: { name: string; roleName: string | null };
  storeName: string;
  pendingOrders: number;
  logout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const { t, num, lang } = useI18n();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path;
  const setOpen = (v: boolean) => setOpenAt(v ? path : null);
  const label = (l: NavLink) => (lang === "bn" ? l.labelBn : l.label);
  const current = links.find((l) => path.startsWith(l.href));

  const groups = Object.keys(NAV_GROUPS)
    .map((g) => ({ g, items: links.filter((l) => l.group === g) }))
    .filter((x) => x.items.length > 0);

  const nav = (
    <nav aria-label={t("Admin", "অ্যাডমিন")} className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {groups.map(({ g, items }) => (
        <div key={g}>
          {NAV_GROUPS[g][lang] && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">{NAV_GROUPS[g][lang]}</p>}
          <div className="space-y-0.5">
            {items.map((l) => {
              const Icon = ICONS[l.icon as keyof typeof ICONS];
              const active = path.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition",
                    active ? "bg-white text-brand-900 shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className={cn("size-[18px] shrink-0", active ? "text-brand-700" : "text-white/60")} aria-hidden />
                  <span className="flex-1 truncate">{label(l)}</span>
                  {l.badge > 0 && (
                    <span className={cn("min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-bold tabular-nums", active ? "bg-brand-700 text-white" : "bg-sun-400 text-ink-900")}>
                      {num(l.badge)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-gradient-to-b from-brand-900 to-[#0b3a22] text-white">
      <Link href="/admin/dashboard" className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
        <LeafMark className="size-10" />
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-lg font-bold">{storeName}</p>
          <p className="text-xs text-lime-300/80">{t("Admin panel", "অ্যাডমিন প্যানেল")}</p>
        </div>
      </Link>
      {nav}
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lime-400 text-sm font-bold text-brand-900" aria-hidden>{user.name.charAt(0).toUpperCase()}</span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-white/60">{user.roleName ?? t("Staff", "স্টাফ")}</p>
          </div>
        </div>
        <form action={logout}>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
            <LogOut className="size-[18px]" aria-hidden /> {t("Sign out", "লগ আউট")}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#f4f7f3] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-dvh lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("Admin menu", "অ্যাডমিন মেনু")}>
          <button className="absolute inset-0 bg-ink-900/50" onClick={() => setOpen(false)} aria-label={t("Close menu", "মেনু বন্ধ করুন")} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">{sidebar}</div>
          <button onClick={() => setOpen(false)} className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white text-ink-900" aria-label={t("Close menu", "মেনু বন্ধ করুন")}>
            <X className="size-5" />
          </button>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-line bg-white/90 px-3 backdrop-blur sm:gap-3 sm:px-6">
          <button className="grid size-10 place-items-center rounded-lg hover:bg-canvas lg:hidden" onClick={() => setOpen(true)} aria-label={t("Open menu", "মেনু খুলুন")}>
            <Menu className="size-5" />
          </button>
          <p className="truncate font-semibold text-ink-900 lg:text-lg">{current ? label(current) : ""}</p>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
            <LangSwitch />
            <Link
              href="/admin/orders?status=pending"
              className="relative grid size-10 place-items-center rounded-full hover:bg-canvas"
              aria-label={t(`${pendingOrders} new orders waiting`, `${num(pendingOrders)}টি নতুন অর্ডার অপেক্ষায়`)}
              title={t("New orders", "নতুন অর্ডার")}
            >
              <Bell className={cn("size-5", pendingOrders > 0 ? "text-ink-900" : "text-ink-400")} aria-hidden />
              {pendingOrders > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-tomato-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">{num(pendingOrders)}</span>
              )}
            </Link>
            <Link href="/" target="_blank" className="hidden h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-ink-900 hover:border-brand-600 hover:text-brand-700 sm:inline-flex">
              <ExternalLink className="size-4" aria-hidden /> {t("View store", "স্টোর দেখুন")}
            </Link>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
