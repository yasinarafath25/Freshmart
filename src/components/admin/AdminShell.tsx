"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3, Boxes, CreditCard, FolderTree, Inbox, LayoutDashboard, LogOut, Menu, Package, Settings, ShieldCheck, ShoppingCart,
  Star, Store, TicketPercent, Truck, UserCog, Users, X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LeafMark } from "@/components/store/Logo";

const ICONS = {
  dashboard: LayoutDashboard, orders: ShoppingCart, products: Package, categories: FolderTree, inventory: Boxes, customers: Users, messages: Inbox,
  reviews: Star, coupons: TicketPercent, delivery: Truck, payments: CreditCard, reports: BarChart3, settings: Settings, users: UserCog, roles: ShieldCheck,
};

export function AdminShell({
  links,
  user,
  storeName,
  logout,
  children,
}: {
  links: { href: string; label: string; icon: string }[];
  user: { name: string; roleName: string | null };
  storeName: string;
  logout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path;
  const setOpen = (v: boolean) => setOpenAt(v ? path : null);

  const nav = (
    <nav aria-label="Admin" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
      {links.map((l) => {
        const Icon = ICONS[l.icon as keyof typeof ICONS];
        const active = path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white")}
          >
            <Icon className={cn("size-[18px]", active && "text-lime-400")} aria-hidden />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-brand-900 text-white">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <LeafMark className="size-9" />
        <div className="leading-tight">
          <p className="font-display text-lg font-bold">{storeName}</p>
          <p className="text-xs text-white/60">Admin panel</p>
        </div>
      </div>
      {nav}
      <div className="border-t border-white/10 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/8 hover:text-white">
          <Store className="size-[18px]" aria-hidden /> View store
        </Link>
        <form action={logout}>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/8 hover:text-white">
            <LogOut className="size-[18px]" aria-hidden /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button className="absolute inset-0 bg-ink-900/50" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 w-64">{sidebar}</div>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white px-4 sm:px-6">
          <button className="grid size-10 place-items-center rounded-lg hover:bg-canvas lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-ink-600">{user.roleName ?? "Staff"}</p>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white" aria-hidden>{user.name.charAt(0).toUpperCase()}</span>
          </div>
        </header>
        <main id="main" className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
