"use client";

import { useActionState } from "react";
import { adjustStockAction, type AdminState } from "@/app/admin/actions";
import { keepValues } from "@/lib/utils/form";

export function StockAdjust({ variantId }: { variantId: string }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(adjustStockAction, null);
  return (
    <form action={action} onSubmit={keepValues(action)} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="variantId" value={variantId} />
      <label className="sr-only" htmlFor={`chg-${variantId}`}>Change in stock</label>
      <input id={`chg-${variantId}`} name="change" type="number" step={1} placeholder="+10 / -2" required className="h-9 w-24 rounded-lg border border-line px-2 text-sm" />
      <label className="sr-only" htmlFor={`rsn-${variantId}`}>Reason</label>
      <select id={`rsn-${variantId}`} name="reason" className="h-9 rounded-lg border border-line px-2 text-sm">
        <option value="restock">Restock</option>
        <option value="adjustment">Adjustment</option>
      </select>
      <label className="sr-only" htmlFor={`note-${variantId}`}>Note</label>
      <input id={`note-${variantId}`} name="note" placeholder="Note" maxLength={120} className="h-9 w-32 rounded-lg border border-line px-2 text-sm" />
      <button disabled={pending} className="h-9 rounded-lg bg-brand-700 px-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">{pending ? "…" : "Apply"}</button>
      {state?.message && <span className={`w-full text-xs ${state.ok ? "text-brand-700" : "text-tomato-600"}`} role="status">{state.message}</span>}
    </form>
  );
}
