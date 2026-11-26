"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";

export function CategoryMenu({ categories }: { categories: { href: string; label: string; image: string | null }[] }) {
  const path = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path; // closes automatically on navigation
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => setOpenAt((cur) => ((typeof v === "function" ? v(cur === path) : v) ? path : null));
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
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-xl bg-brand-700 px-5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-brand-800"
      >
        <Menu className="size-5" aria-hidden />
        All Categories
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
                Browse all products →
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
  categories: { href: string; label: string }[];
  signedIn: boolean;
  accountHref: string;
}) {
  const path = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path;
  const setOpen = (v: boolean) => setOpenAt(v ? path : null);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="grid size-11 place-items-center rounded-full hover:bg-mint-50 lg:hidden" aria-label="Open menu">
        <Menu className="size-6" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-ink-900/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="animate-fade-in absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-white shadow-pop">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-display text-lg font-bold text-brand-700">Menu</span>
              <button onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-mint-50" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <nav className="p-2" aria-label="Mobile">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="flex rounded-xl px-3 py-3 font-medium hover:bg-mint-50">
                  {n.label}
                </Link>
              ))}
              <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Categories</p>
              {categories.map((n) => (
                <Link key={n.href} href={n.href} className="flex rounded-xl px-3 py-2.5 text-[15px] hover:bg-mint-50">
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto border-t border-line p-4">
              <Link href={accountHref} className="flex h-11 items-center justify-center rounded-xl bg-brand-700 font-semibold text-white">
                {signedIn ? "My account" : "Login / Register"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
