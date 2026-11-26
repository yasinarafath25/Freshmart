"use client";

import { createContext, useContext, useMemo } from "react";
import { DICTS, fmtDate, fmtMoney, fmtNum, slotLabel, unitLabel, type Lang } from "./dict";
import { tMsg, tState } from "./messages";

const Ctx = createContext<{ lang: Lang; currency: string }>({ lang: "en", currency: "৳" });

export function I18nProvider({ lang, currency, children }: { lang: Lang; currency: string; children: React.ReactNode }) {
  const value = useMemo(() => ({ lang, currency }), [lang, currency]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const { lang, currency } = useContext(Ctx);
  return useMemo(
    () => ({
      lang,
      d: DICTS[lang],
      money: (minor: number) => fmtMoney(minor, currency, lang),
      num: (n: number | string) => fmtNum(n, lang),
      unit: (t: string) => unitLabel(t, lang),
      slot: (t: string) => slotLabel(t, lang),
      date: (v: Date | string, opts?: Intl.DateTimeFormatOptions) => fmtDate(v, lang, opts),
      /** Translate a server message / action state for display. */
      msg: (text: string | null | undefined) => tMsg(text, lang),
      st: <T extends { message?: string; errors?: Record<string, string> } | null>(state: T) => tState(state, lang),
    }),
    [lang, currency],
  );
}
