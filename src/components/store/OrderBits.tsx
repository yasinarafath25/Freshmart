import { Check, CircleX } from "lucide-react";
import { Badge } from "@/components/ui";
import type { OrderStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils/cn";

const STATUS: Record<OrderStatus, { label: string; tone: "yellow" | "blue" | "purple" | "green" | "red" | "neutral" }> = {
  pending: { label: "Pending", tone: "yellow" },
  confirmed: { label: "Confirmed", tone: "blue" },
  processing: { label: "Packing", tone: "purple" },
  out_for_delivery: { label: "Out for delivery", tone: "blue" },
  delivered: { label: "Delivered", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

const PAY: Record<string, { label: string; tone: "yellow" | "green" | "red" | "neutral" | "blue" }> = {
  unpaid: { label: "Unpaid", tone: "neutral" },
  pending: { label: "Payment pending", tone: "yellow" },
  paid: { label: "Paid", tone: "green" },
  failed: { label: "Payment failed", tone: "red" },
  refunded: { label: "Refunded", tone: "blue" },
};
export function PaymentStatusBadge({ status }: { status: string }) {
  const s = PAY[status] ?? PAY.unpaid;
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

const FLOW: OrderStatus[] = ["pending", "confirmed", "processing", "out_for_delivery", "delivered"];

export function StatusTimeline({ status, history }: { status: OrderStatus; history: { id: string; status: OrderStatus; note: string | null; createdAt: Date }[] }) {
  if (status === "cancelled") {
    const c = history.findLast((h) => h.status === "cancelled");
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-tomato-600">
        <CircleX className="size-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Order cancelled</p>
          {c?.note && <p className="text-sm">{c.note}</p>}
        </div>
      </div>
    );
  }
  const idx = FLOW.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Order progress">
      {FLOW.map((s, i) => {
        const done = i <= idx;
        const when = history.find((h) => h.status === s)?.createdAt;
        return (
          <li key={s} className="flex flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={cn("h-1 flex-1 rounded", i === 0 ? "invisible" : done ? "bg-leaf-500" : "bg-line")} />
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border-2", done ? "border-leaf-500 bg-leaf-500 text-white" : "border-line bg-white text-ink-400")}>
                {done ? <Check className="size-4" aria-hidden /> : <span className="text-xs font-bold">{i + 1}</span>}
              </span>
              <span className={cn("h-1 flex-1 rounded", i === FLOW.length - 1 ? "invisible" : i < idx ? "bg-leaf-500" : "bg-line")} />
            </div>
            <span className={cn("mt-2 text-[11px] font-medium leading-tight sm:text-xs", done ? "text-ink-900" : "text-ink-400")}>{STATUS[s].label}</span>
            {when && <span className="hidden text-[11px] text-ink-400 sm:block">{when.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
            <span className="sr-only">{done ? "completed" : "pending"}</span>
          </li>
        );
      })}
    </ol>
  );
}
