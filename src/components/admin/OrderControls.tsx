"use client";

import { useActionState } from "react";
import { Check, ChevronRight, Loader2, PackageCheck, Truck, XCircle } from "lucide-react";
import { markOrderPaidAction, updateOrderStatusAction, type AdminState } from "@/app/admin/actions";
import { Alert, Button, Field, Select, Textarea } from "@/components/ui";
import { keepValues } from "@/lib/utils/form";

const LABELS: Record<string, string> = { confirmed: "Confirmed", processing: "Packing", out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancel order" };

/** The natural next step for each status, with its button text and icon. */
export const NEXT_STEP: Record<string, { to: string; label: string; Icon: typeof Check } | undefined> = {
  pending: { to: "confirmed", label: "Confirm order", Icon: Check },
  confirmed: { to: "processing", label: "Start packing", Icon: PackageCheck },
  processing: { to: "out_for_delivery", label: "Out for delivery", Icon: Truck },
  out_for_delivery: { to: "delivered", label: "Mark delivered", Icon: Check },
};

const CANCEL_CONFIRM = "Cancel this order? Stock will be returned and the customer notified.";

/** Order detail page: one big button for the next step, cancel, and a full form for anything else. */
export function StatusControl({ orderId, status, next }: { orderId: string; status: string; next: string[] }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(updateOrderStatusAction, null);
  if (next.length === 0) return <p className="text-sm text-ink-600">This order is closed. No further status changes are possible.</p>;
  const step = NEXT_STEP[status];
  const canCancel = next.includes("cancelled");
  return (
    <div className="space-y-3">
      {step && (
        <form action={action} onSubmit={keepValues(action)}>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="status" value={step.to} />
          <Button size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <step.Icon className="size-5" aria-hidden />}
            {step.label}
          </Button>
        </form>
      )}
      {canCancel && (
        <form action={action} onSubmit={keepValues(action, CANCEL_CONFIRM)}>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="status" value="cancelled" />
          <Button variant="secondary" className="w-full text-tomato-600 hover:border-tomato-500 hover:text-tomato-600" disabled={pending}>
            <XCircle className="size-4" aria-hidden /> Cancel order
          </Button>
        </form>
      )}
      {state?.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}
      <details className="rounded-xl border border-line p-3">
        <summary className="cursor-pointer text-sm font-semibold text-ink-600">More options (skip a step, add a note)</summary>
        <form
          action={action}
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            const s = (e.currentTarget.elements.namedItem("status") as HTMLSelectElement).value;
            keepValues(action, s === "cancelled" ? CANCEL_CONFIRM : undefined)(e);
          }}
        >
          <input type="hidden" name="orderId" value={orderId} />
          <Field label="Move to" htmlFor="status">
            <Select id="status" name="status" defaultValue={next[0]}>
              {next.map((s) => <option key={s} value={s}>{LABELS[s] ?? s}</option>)}
            </Select>
          </Field>
          <Field label="Note to customer (optional)" htmlFor="note">
            <Textarea id="note" name="note" maxLength={300} className="min-h-16" />
          </Field>
          <Button variant="outline" disabled={pending} className="w-full">{pending ? "Updating…" : "Update status"}</Button>
        </form>
      </details>
    </div>
  );
}

/** Orders list: a compact one-click button that moves the order to its next step. */
export function QuickAdvance({ orderId, status }: { orderId: string; status: string }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(updateOrderStatusAction, null);
  const step = NEXT_STEP[status];
  if (!step) return null;
  return (
    <form action={action} onSubmit={keepValues(action)} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="status" value={step.to} />
      <button
        disabled={pending}
        className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition disabled:opacity-60 ${
          status === "pending" ? "bg-brand-700 text-white hover:bg-brand-800" : "border border-brand-700 text-brand-700 hover:bg-brand-50"
        }`}
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <step.Icon className="size-4" aria-hidden />}
        {step.label}
        <ChevronRight className="size-3.5 opacity-60" aria-hidden />
      </button>
      {state && !state.ok && state.message && <span className="max-w-48 text-xs text-tomato-600" role="alert">{state.message}</span>}
    </form>
  );
}

export function MarkPaid({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(markOrderPaidAction, null);
  return (
    <form action={action} className="space-y-2" onSubmit={keepValues(action, "Confirm the full cash amount was collected?")}>
      <input type="hidden" name="orderId" value={orderId} />
      {state?.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}
      <Button variant="outline" disabled={pending} className="w-full">{pending ? "Saving…" : "Mark cash collected"}</Button>
    </form>
  );
}
