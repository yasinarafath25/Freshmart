import { Search } from "lucide-react";

export function SearchBar({ compact, defaultValue }: { compact?: boolean; defaultValue?: string }) {
  return (
    <form action="/search" method="get" role="search" className="relative flex w-full">
      <label htmlFor={compact ? "q-mobile" : "q"} className="sr-only">
        Search products
      </label>
      <input
        id={compact ? "q-mobile" : "q"}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search for fruits, vegetables or anything…"
        maxLength={80}
        autoComplete="off"
        className={`w-full rounded-full border border-line bg-white pl-5 pr-16 text-[15px] placeholder:text-ink-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/10 ${compact ? "h-11" : "h-12"}`}
      />
      <button
        type="submit"
        aria-label="Search"
        className={`absolute right-1 top-1 grid place-items-center rounded-full bg-brand-700 text-white transition hover:bg-brand-800 ${compact ? "h-9 w-12" : "h-10 w-14"}`}
      >
        <Search className="size-5" />
      </button>
    </form>
  );
}
