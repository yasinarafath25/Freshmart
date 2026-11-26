/** Money is stored as integer minor units (paisa). */
export function formatMoney(minor: number, symbol = "৳"): string {
  const major = minor / 100;
  const hasFraction = minor % 100 !== 0;
  return `${symbol}${major.toLocaleString("en-IN", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function toMinor(major: number | string): number {
  const n = typeof major === "string" ? Number(major) : major;
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

export function discountPercent(price: number, compareAt: number | null | undefined): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
