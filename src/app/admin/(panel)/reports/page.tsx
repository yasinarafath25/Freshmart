import Link from "next/link";
import { Download } from "lucide-react";
import { requireStaffPage } from "@/lib/auth/guards";
import { couponUsage, salesByCategory, salesByDay, topProducts } from "@/lib/services/reports";
import { getSettings } from "@/lib/services/settings";
import { getI18n } from "@/lib/i18n/server";
import { NoAccess, PageHeader, Table, td, filterInput } from "@/components/admin/ui";
import { BarChart, RankBars } from "@/components/admin/Chart";
import { Card } from "@/components/ui";
import { parseRange } from "@/lib/utils/range";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const { allowed } = await requireStaffPage("reports:read");
  if (!allowed) return <NoAccess />;
  const settings = await getSettings();
  const r = parseRange(await searchParams, settings.timeZone);
  const [days, cats, top, cpn] = await Promise.all([salesByDay(r), salesByCategory(r), topProducts(r, 10), couponUsage(r)]);
  const { t, money: fmt, num, lang } = await getI18n();
  const total = days.reduce((s, d) => s + d.revenue, 0);
  const orders = days.reduce((s, d) => s + d.orders, 0);
  const qs = `from=${r.fromStr}&to=${r.toStr}`;
  return (
    <>
      <PageHeader
        title={t("Reports", "রিপোর্ট")}
        description={t("Sales from orders that were not cancelled, by order date.", "বাতিল হয়নি এমন অর্ডারের বিক্রি, অর্ডারের তারিখ অনুযায়ী।")}
        actions={<Link href={`/admin/reports/export?${qs}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold hover:border-brand-600"><Download className="size-4" aria-hidden /> {t("Download (Excel/CSV)", "ডাউনলোড (Excel/CSV)")}</Link>}
      />
      <form method="get" className="mb-6 flex flex-wrap items-end gap-2 rounded-2xl border border-line bg-white p-3">
        <label className="text-xs text-ink-600">{t("From", "শুরু")} <input type="date" name="from" defaultValue={r.fromStr} className={filterInput} /></label>
        <label className="text-xs text-ink-600">{t("To", "শেষ")} <input type="date" name="to" defaultValue={r.toStr} className={filterInput} /></label>
        <button className="h-10 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white">{t("Show", "দেখুন")}</button>
      </form>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-ink-600">{t("Sales", "বিক্রি")}</p><p className="text-2xl font-bold tabular-nums">{fmt(total)}</p></Card>
        <Card className="p-5"><p className="text-sm text-ink-600">{t("Orders", "অর্ডার")}</p><p className="text-2xl font-bold tabular-nums">{num(orders)}</p></Card>
        <Card className="p-5"><p className="text-sm text-ink-600">{t("Average order", "গড় অর্ডার")}</p><p className="text-2xl font-bold tabular-nums">{fmt(orders ? Math.round(total / orders) : 0)}</p></Card>
      </div>
      <Card className="mb-6 p-5">
        <h2 className="font-semibold">{t("Sales by day", "দিনভিত্তিক বিক্রি")}</h2>
        <div className="mt-4"><BarChart label={t("Sales by day", "দিনভিত্তিক বিক্রি")} data={days.map((d) => ({ key: d.day, label: new Date(d.day + "T00:00:00Z").toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" }), value: d.revenue }))} format={fmt} height={200} /></div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5"><h2 className="mb-4 font-semibold">{t("Sales by category", "ক্যাটাগরি অনুযায়ী বিক্রি")}</h2>{cats.length ? <RankBars rows={cats.map((c) => ({ label: c.category, value: c.revenue, sub: t(`· ${c.units} units`, `· ${num(c.units)}টি`) }))} format={fmt} /> : <p className="text-sm text-ink-600">{t("No sales in this period.", "এই সময়ে কোনো বিক্রি নেই।")}</p>}</Card>
        <Card className="p-5"><h2 className="mb-4 font-semibold">{t("Best sellers", "সবচেয়ে বেশি বিক্রি")}</h2>{top.length ? <RankBars rows={top.map((x) => ({ label: x.name, value: x.revenue, sub: t(`· ${x.units} sold`, `· ${num(x.units)}টি`) }))} format={fmt} /> : <p className="text-sm text-ink-600">{t("No sales in this period.", "এই সময়ে কোনো বিক্রি নেই।")}</p>}</Card>
      </div>
      <h2 className="mb-3 mt-8 font-semibold">{t("Coupon usage", "কুপন ব্যবহার")}</h2>
      <Table head={[t("Code", "কোড"), t("Uses", "ব্যবহার"), t("Total discount", "মোট ছাড়")]} empty={cpn.length === 0 && <p className="p-6 text-center text-sm text-ink-600">{t("No coupons used in this period.", "এই সময়ে কোনো কুপন ব্যবহার হয়নি।")}</p>}>
        {cpn.map((c) => <tr key={c.code}><td className={`${td} font-mono font-bold`}>{c.code}</td><td className={`${td} tabular-nums`}>{num(c.uses)}</td><td className={`${td} tabular-nums`}>{fmt(c.discount)}</td></tr>)}
      </Table>
    </>
  );
}
