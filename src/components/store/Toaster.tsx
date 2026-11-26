"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, TriangleAlert, X } from "lucide-react";

export type ToastInput = { message: string; tone?: "success" | "error"; action?: { href: string; label: string } };

/** Fire a toast from anywhere on the client. */
export function toast(t: ToastInput) {
  window.dispatchEvent(new CustomEvent<ToastInput>("fm:toast", { detail: t }));
}

/** Bottom toast stack. Sits above the mobile bottom nav. */
export function Toaster() {
  const [items, setItems] = useState<(ToastInput & { id: number })[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const detail = (e as CustomEvent<ToastInput>).detail;
      const id = Date.now() + Math.random();
      setItems((xs) => [...xs.slice(-2), { ...detail, id }]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3500);
    };
    window.addEventListener("fm:toast", on);
    return () => window.removeEventListener("fm:toast", on);
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6">
      {items.map((t) => (
        <div key={t.id} className="animate-fade-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-ink-900 px-4 py-3 text-sm text-white shadow-pop">
          {t.tone === "error" ? <TriangleAlert className="size-5 shrink-0 text-sun-400" aria-hidden /> : <CheckCircle2 className="size-5 shrink-0 text-lime-400" aria-hidden />}
          <span className="flex-1">{t.message}</span>
          {t.action && (
            <Link href={t.action.href} className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25">
              {t.action.label}
            </Link>
          )}
          <button onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))} className="shrink-0 text-white/60 hover:text-white" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
