"use client";

import { useActionState } from "react";
import { markOrderPaidAction, updateOrderStatusAction, type AdminState } from "@/app/admin/actions";
import { Alert, Button, Field, Select, Textarea } from "@/components/ui";
import { keepValues } from "@/lib/utils/form";

const LABELS: Record<string, string> = { confirmed: "Confirmed", processing: "Packing", out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancel order" };

export function StatusControl({ orderId, next }: { orderId: string; next: string[] }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(updateOrderStatusAction, null);
  if (next.length === 0) return <p className="text-sm text-ink-600">This order is closed. No further status changes are possible.</p>;
  return (
    <form
      action={action}
      className="space-y-3"
      onSubmit={(e) => {
        const s = (e.currentTarget.elements.namedItem("status") as HTMLSelectElement).value;
        keepValues(action, s === "cancelled" ? "Cancel this order? Stock will be returned and the customer notified." : undefined)(e);
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
      {state?.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}
      <Button disabled={pending} className="w-full">{pending ? "Updating…" : "Update status"}</Button>
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
