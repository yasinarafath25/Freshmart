import { storeDate } from "./dates";

/** Parses an inclusive YYYY-MM-DD from/to range in the store time zone; default last 30 days, max 366 days. */
export function parseRange(sp: { from?: string; to?: string }, tz = "UTC") {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const valid = (s?: string) => !!s && iso.test(s) && !isNaN(+new Date(s + "T00:00:00Z"));
  const to = valid(sp.to) ? sp.to! : storeDate(tz);
  const toMs = +new Date(to + "T00:00:00Z");
  let from = valid(sp.from) ? sp.from! : new Date(toMs - 29 * 86400000).toISOString().slice(0, 10);
  const fromMs = +new Date(from + "T00:00:00Z");
  if (fromMs > toMs || toMs - fromMs > 365 * 86400000) from = new Date(toMs - 29 * 86400000).toISOString().slice(0, 10);
  return { from, to, tz, fromStr: from, toStr: to };
}
