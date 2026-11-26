import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DICTS, fmtDate, fmtDateTime, fmtMoney, fmtNum, slotLabel, unitLabel, type Lang } from "./dict";
import { getSettings } from "@/lib/services/settings";
import { tMsg } from "./messages";

export const LANG_COOKIE = "fm_lang";

/** Language for this request: cookie → browser Accept-Language → English. */
export const getLang = cache(async (): Promise<Lang> => {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  if (c === "bn" || c === "en") return c;
  const al = (await headers()).get("accept-language") ?? "";
  return /^\s*bn\b/i.test(al) ? "bn" : "en";
});

export type Localized = { name: string; nameBn?: string | null };
export function pick(lang: Lang, en: string, bn?: string | null) {
  return lang === "bn" && bn ? bn : en;
}

/** Everything a Server Component needs to render text in the current language. */
export const getI18n = cache(async () => {
  const [lang, settings] = await Promise.all([getLang(), getSettings()]);
  const d = DICTS[lang];
  return {
    lang,
    d,
    money: (minor: number) => fmtMoney(minor, settings.currencySymbol, lang),
    num: (n: number | string) => fmtNum(n, lang),
    unit: (text: string) => unitLabel(text, lang),
    slot: (text: string) => slotLabel(text, lang),
    date: (v: Date | string, opts?: Intl.DateTimeFormatOptions) => fmtDate(v, lang, opts),
    dateTime: (v: Date) => fmtDateTime(v, lang),
    name: (o: Localized) => pick(lang, o.name, o.nameBn),
    pick: (en: string, bn?: string | null) => pick(lang, en, bn),
    msg: (text: string | null | undefined) => tMsg(text, lang),
  };
});
