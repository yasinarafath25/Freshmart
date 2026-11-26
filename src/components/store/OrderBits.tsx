import { Check, CircleX } from "lucide-react";
import { Badge } from "@/components/ui";
import type { OrderStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils/cn";
import { DICTS, fmtDateTime, type Lang } from "@/lib/i18n/dict";
import { tMsg } from "@/lib/i18n/messages";

const TONE: Record<OrderStatus, "yellow" | "blue" | "purple" | "green" | "red"> = {
  pending: "yellow",
  confirmed: "blue",
  processing: "purple",
  out_for_delivery: "blue",
  delivered: "green",
  cancelled: "red",
};

export function OrderStatusBadge({ status, lang = "en" }: { status: OrderStatus; lang?: Lang }) {
  return <Badge tone={TONE[status]}>{DICTS[lang].order.status[status]}</Badge>;
}

const PAY_TONE: Record<string, "yellow" | "green" | "red" | "neutral" | "blue"> = { unpaid: "neutral", pending: "yellow", paid: "green", failed: "red", refunded: "blue" };
export function PaymentStatusBadge({ status, lang = "en" }: { status: string; lang?: Lang }) {
  const labels = DICTS[lang].order.pay as Record<string, string>;
  return <Badge tone={PAY_TONE[status] ?? "neutral"}>{labels[status] ?? status}</Badge>;
}

const FLOW: OrderStatus[] = ["pending", "confirmed", "processing", "out_for_delivery", "delivered"];

export function StatusTimeline({
  status,
  history,
  lang = "en",
}: {
  status: OrderStatus;
  history: { id: string; status: OrderStatus; note: string | null; createdAt: Date }[];
  lang?: Lang;
}) {
  const d = DICTS[lang].order;
  if (status === "cancelled") {
    const c = history.findLast((h) => h.status === "cancelled");
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-tomato-600">
        <CircleX className="size-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{d.cancelled}</p>
          {c?.note && <p className="text-sm">{tMsg(c.note, lang)}</p>}
        </div>
      </div>
    );
  }
  const idx = FLOW.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label={d.progress}>
      {FLOW.map((s, i) => {
        const done = i <= idx;
        const when = history.find((h) => h.status === s)?.createdAt;
        return (
          <li key={s} className="flex flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={cn("h-1 flex-1 rounded", i === 0 ? "invisible" : done ? "bg-leaf-500" : "bg-line")} />
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border-2", done ? "border-leaf-500 bg-leaf-500 text-white" : "border-line bg-white text-ink-400")}>
                {done ? <Check className="size-4" aria-hidden /> : <span className="text-xs font-bold">{lang === "bn" ? "০১২৩৪৫"[i + 1] : i + 1}</span>}
              </span>
              <span className={cn("h-1 flex-1 rounded", i === FLOW.length - 1 ? "invisible" : i < idx ? "bg-leaf-500" : "bg-line")} />
            </div>
            <span className={cn("mt-2 text-[11px] font-medium leading-tight sm:text-xs", done ? "text-ink-900" : "text-ink-400")}>{d.status[s]}</span>
            {when && <span className="hidden text-[11px] text-ink-400 sm:block">{fmtDateTime(when, lang)}</span>}
          </li>
        );
      })}
    </ol>
  );
}
