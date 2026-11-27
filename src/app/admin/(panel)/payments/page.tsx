import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { orders, payments } from "@/lib/db/schema";
import { isSslcommerzEnabled } from "@/lib/services/payments";
import { getSettings } from "@/lib/services/settings";
import { getI18n } from "@/lib/i18n/server";
import { NoAccess, PageHeader, Pager, Table, td } from "@/components/admin/ui";
import { Alert, Badge, Card } from "@/components/ui";

export const metadata = { title: "Payments" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { allowed } = await requireStaffPage("payments:read");
  if (!allowed) return <NoAccess />;
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const per = 30;
  const db = getDb();
  const [rows, count, settings, unpaidCod] = await Promise.all([
    db.select({ p: payments, orderNumber: orders.orderNumber }).from(payments).innerJoin(orders, eq(orders.id, payments.orderId)).orderBy(desc(payments.createdAt)).limit(per).offset((page - 1) * per),
    db.$count(payments),
    getSettings(),
    db.select({ n: sql<number>`count(*)::int`, sum: sql<number>`coalesce(sum(total),0)::int` }).from(orders).where(sql`${orders.paymentMethod} = 'cod' and ${orders.paymentStatus} = 'unpaid' and ${orders.status} = 'delivered'`),
  ]);
  const { t, money, num, dateTime } = await getI18n();
  const online = isSslcommerzEnabled();
  return (
    <>
      <PageHeader title={t("Payments", "পেমেন্ট")} description={t("Every payment received. Cash payments appear here when you press “Mark cash collected” on an order.", "সব পেমেন্টের হিসাব। অর্ডারে “টাকা পেয়েছি” চাপলে ক্যাশ পেমেন্ট এখানে যোগ হয়।")} />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-ink-600">{t("Cash on delivery", "ক্যাশ অন ডেলিভারি")}</p><p className="mt-1 font-semibold">{settings.codEnabled ? <Badge tone="green">{t("On", "চালু")}</Badge> : <Badge>{t("Off", "বন্ধ")}</Badge>}</p><p className="mt-1 text-xs text-ink-400">{t("Change in Settings", "সেটিংসে বদলানো যায়")}</p></Card>
        <Card className="p-5"><p className="text-sm text-ink-600">{t("SSLCommerz (online)", "SSLCommerz (অনলাইন)")}</p><p className="mt-1 font-semibold">{online ? <Badge tone="green">{t("Set up", "চালু করা আছে")}</Badge> : <Badge>{t("Not set up", "চালু হয়নি")}</Badge>}</p><p className="mt-1 text-xs text-ink-400">{online ? (process.env.SSLCOMMERZ_SANDBOX !== "false" ? t("Test mode", "টেস্ট মোড") : t("Live mode", "লাইভ মোড")) : t("Add SSLCOMMERZ_* settings on the server to enable", "চালু করতে সার্ভারে SSLCOMMERZ_* সেটিংস দিন")}</p></Card>
        <Card className="p-5"><p className="text-sm text-ink-600">{t("Delivered but cash not recorded", "ডেলিভারি হয়েছে কিন্তু টাকা জমা হয়নি")}</p><p className="mt-1 text-xl font-bold tabular-nums">{num(unpaidCod[0]?.n ?? 0)} · {money(unpaidCod[0]?.sum ?? 0)}</p></Card>
      </div>
      {!online && <Alert tone="info" className="mb-4">{t("Online payments are off. The SSLCommerz integration is built but must be tested with test credentials before going live.", "অনলাইন পেমেন্ট এখন বন্ধ। SSLCommerz যুক্ত করা আছে, তবে চালুর আগে টেস্ট অ্যাকাউন্ট দিয়ে পরীক্ষা করতে হবে।")}</Alert>}
      <Table head={[t("Date", "তারিখ"), t("Order", "অর্ডার"), t("Method", "মাধ্যম"), t("Transaction", "লেনদেন"), t("Amount", "পরিমাণ"), t("Status", "অবস্থা")]} empty={rows.length === 0 && <p className="p-8 text-center text-sm text-ink-600">{t("No payments yet.", "এখনো কোনো পেমেন্ট নেই।")}</p>}>
        {rows.map(({ p, orderNumber }) => (
          <tr key={p.id}>
            <td className={td}>{dateTime(p.createdAt)}</td>
            <td className={td}><Link href={`/admin/orders/${p.orderId}`} className="font-semibold text-brand-700 hover:underline">{orderNumber}</Link></td>
            <td className={td}>{p.provider === "cod" ? t("Cash", "ক্যাশ") : "SSLCommerz"}</td>
            <td className={`${td} font-mono text-xs`}>{p.transactionId}</td>
            <td className={`${td} tabular-nums`}>{money(p.amount)} <span className="text-xs text-ink-400">{p.currency}</span></td>
            <td className={td}><Badge tone={p.status === "success" ? "green" : p.status === "initiated" ? "yellow" : "red"}>{({ success: t("Successful", "সফল"), initiated: t("Started", "শুরু হয়েছে"), failed: t("Failed", "ব্যর্থ"), cancelled: t("Cancelled", "বাতিল") } as Record<string, string>)[p.status] ?? p.status}</Badge></td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={Math.max(1, Math.ceil(count / per))} href={(n) => `/admin/payments?page=${n}`} />
    </>
  );
}
