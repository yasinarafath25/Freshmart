"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { LangSwitch } from "./LangSwitch";

export function CategoryMenu({ categories }: { categories: { href: string; label: string; image: string | null }[] }) {
  const { d } = useI18n();
  const path = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path; // closes automatically on navigation
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpenAt(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpenAt(open ? null : path)}
        className="flex h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-xl bg-brand-700 px-5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-brand-800"
      >
        <Menu className="size-5" aria-hidden />
        {d.header.allCategories}
        <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div className="animate-fade-in absolute left-0 top-full mt-2 w-72 rounded-2xl border border-line bg-white p-2 shadow-pop">
          <ul>
            {categories.map((c) => (
              <li key={c.href}>
                <Link href={c.href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-medium hover:bg-mint-50 hover:text-brand-700">
                  {c.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt="" width={32} height={32} className="size-8 rounded-lg object-cover" />
                  )}
                  {c.label}
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-line pt-1">
              <Link href="/shop" className="flex rounded-xl px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-mint-50">
                {d.header.browseAll}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export function MobileMenu({
  nav,
  categories,
  signedIn,
  accountHref,
}: {
  nav: { href: string; label: string }[];
  categories: { href: string; label: string; image: string | null }[];
  signedIn: boolean;
  accountHref: string;
}) {
  const { d } = useI18n();
  const path = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path;
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpenAt(path)} className="grid size-11 place-items-center rounded-full hover:bg-mint-50 lg:hidden" aria-label={d.header.openMenu}>
        <Menu className="size-6" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={d.header.menu}>
          <button className="absolute inset-0 bg-ink-900/40" aria-label={d.header.closeMenu} onClick={() => setOpenAt(null)} />
          <div className="animate-fade-in absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-white shadow-pop">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-display text-lg font-bold text-brand-700">{d.header.menu}</span>
              <button onClick={() => setOpenAt(null)} className="grid size-10 place-items-center rounded-full hover:bg-mint-50" aria-label={d.header.closeMenu}>
                <X className="size-5" />
              </button>
            </div>
            <div className="border-b border-line px-4 py-3">
              <LangSwitch />
            </div>
            <nav className="p-2" aria-label={d.header.menu}>
              {nav.map((n) => (
                <Link key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined} className="flex rounded-xl px-3 py-3 font-medium hover:bg-mint-50 aria-[current=page]:bg-mint-50 aria-[current=page]:text-brand-700">
                  {n.label}
                </Link>
              ))}
              <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">{d.header.categories}</p>
              <div className="grid grid-cols-2 gap-2 p-2">
                {categories.map((n) => (
                  <Link key={n.href} href={n.href} className="flex items-center gap-2 rounded-xl border border-line p-2 text-sm font-medium hover:border-brand-600 hover:bg-mint-50">
                    {n.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.image} alt="" width={36} height={36} loading="lazy" className="size-9 shrink-0 rounded-lg object-cover" />
                    )}
                    <span className="leading-tight">{n.label}</span>
                  </Link>
                ))}
              </div>
            </nav>
            <div className="mt-auto border-t border-line p-4">
              <Link href={accountHref} className="flex h-11 items-center justify-center rounded-xl bg-brand-700 font-semibold text-white">
                {signedIn ? d.header.myAccount : d.header.login}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
