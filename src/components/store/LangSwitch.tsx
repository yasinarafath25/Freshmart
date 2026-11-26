"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { setLangAction } from "@/app/actions/lang";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils/cn";

/** Two-option language toggle: English | বাংলা. */
export function LangSwitch({ variant = "light", className }: { variant?: "light" | "dark"; className?: string }) {
  const { lang, d } = useI18n();
  const [pending, start] = useTransition();
  const opt = (l: "en" | "bn", label: string) => (
    <button
      type="button"
      lang={l}
      aria-pressed={lang === l}
      disabled={pending}
      onClick={() => lang !== l && start(() => setLangAction(l))}
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[13px] font-semibold transition",
        lang === l
          ? variant === "dark" ? "bg-white text-brand-900" : "bg-brand-700 text-white"
          : variant === "dark" ? "text-white/80 hover:text-white" : "text-ink-600 hover:text-brand-700",
      )}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label={d.header.language} className={cn("flex items-center gap-1", pending && "opacity-60", className)}>
      <Languages className={cn("size-4", variant === "dark" ? "text-lime-400" : "text-brand-700")} aria-hidden />
      <div className={cn("flex rounded-full p-0.5", variant === "dark" ? "bg-white/10" : "bg-mint-50")}>
        {opt("en", "EN")}
        {opt("bn", "বাং")}
      </div>
    </div>
  );
}
