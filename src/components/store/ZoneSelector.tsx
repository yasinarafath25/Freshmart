"use client";

import { useTransition } from "react";
import { MapPin } from "lucide-react";
import { setZoneAction } from "@/app/actions/cart";

export function ZoneSelector({ zones, currentId, fallback }: { zones: { id: string; name: string }[]; currentId: string | null; fallback: string }) {
  const [pending, start] = useTransition();
  if (zones.length === 0) return null;
  return (
    <div className="hidden items-center gap-2 lg:flex">
      <MapPin className="size-6 shrink-0 fill-leaf-500/15 text-leaf-500" aria-hidden />
      <div className="leading-tight">
        <label htmlFor="zone" className="block text-xs text-ink-600">
          Deliver to
        </label>
        <select
          id="zone"
          value={currentId ?? ""}
          disabled={pending}
          onChange={(e) => start(() => setZoneAction(e.target.value))}
          className="-ml-1 max-w-44 cursor-pointer appearance-none bg-transparent pr-5 text-[15px] font-semibold text-ink-900 focus:outline-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2314231a%22 stroke-width=%222.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_center] bg-no-repeat"
        >
          {!currentId && <option value="">{fallback}</option>}
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
