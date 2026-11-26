"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";

type Suggestion = { id: string; slug: string; name: string; nameBn: string | null; image: string | null; price: number; variantName: string | null; stock: number };

/** Search box with live suggestions (debounced, keyboard accessible). Works as a plain GET form without JS. */
export function SearchBar({ compact, defaultValue }: { compact?: boolean; defaultValue?: string }) {
  const { d, lang, money, unit } = useI18n();
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState(defaultValue ?? "");
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(term)}&perPage=6`, { signal: ctrl.signal });
        const json = await res.json();
        setItems(json.data?.items ?? []);
        setActive(-1);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const show = open && q.trim().length >= 2 && items !== null;
  const name = (s: Suggestion) => (lang === "bn" && s.nameBn ? s.nameBn : s.name);

  return (
    <div ref={box} className="relative w-full">
      <form
        action="/search"
        method="get"
        role="search"
        className="relative flex w-full"
        onSubmit={(e) => {
          if (active >= 0 && items?.[active]) {
            e.preventDefault();
            setOpen(false);
            router.push(`/product/${items[active].slug}`);
          } else setOpen(false);
        }}
      >
        <label htmlFor={compact ? "q-mobile" : "q"} className="sr-only">
          {d.header.searchLabel}
        </label>
        <input
          id={compact ? "q-mobile" : "q"}
          name="q"
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            if (e.target.value.trim().length < 2) setItems(null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!show || !items?.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, items.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, -1));
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder={d.header.searchPlaceholder}
          maxLength={80}
          autoComplete="off"
          role="combobox"
          aria-expanded={show}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className={`w-full rounded-full border border-line bg-white pl-5 pr-16 text-[15px] placeholder:text-ink-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/10 ${compact ? "h-11" : "h-12"}`}
        />
        <button
          type="submit"
          aria-label={d.nav.search}
          className={`absolute right-1 top-1 grid place-items-center rounded-full bg-brand-700 text-white transition hover:bg-brand-800 ${compact ? "h-9 w-12" : "h-10 w-14"}`}
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
        </button>
      </form>

      {show && (
        <div className="animate-fade-in absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
          {items!.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-600">{d.catalog.noSuggestions}</p>
          ) : (
            <ul id={listId} role="listbox" aria-label={d.catalog.suggestions}>
              {items!.map((s, idx) => (
                <li key={s.id} id={`${listId}-${idx}`} role="option" aria-selected={idx === active}>
                  <Link
                    href={`/product/${s.slug}`}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 hover:bg-mint-50 ${idx === active ? "bg-mint-50" : ""}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.image ?? "/images/placeholder.svg"} alt="" width={40} height={40} className="size-10 shrink-0 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{name(s)}</span>
                      {s.variantName && <span className="text-xs text-ink-600">{unit(s.variantName)}</span>}
                    </span>
                    <span className={`shrink-0 text-sm font-semibold tabular-nums ${s.stock > 0 ? "" : "text-ink-400 line-through"}`}>{money(s.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/search?q=${encodeURIComponent(q.trim())}`} onClick={() => setOpen(false)} className="block border-t border-line px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-mint-50">
            {d.catalog.seeAllResults(q.trim())}
          </Link>
        </div>
      )}
    </div>
  );
}
