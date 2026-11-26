import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { orders, payments } from "@/lib/db/schema";
import { isSslcommerzEnabled } from "@/lib/services/payments";
import { getSettings } from "@/lib/services/settings";
import { formatMoney } from "@/lib/utils/money";
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
  const cur = settings.currencySymbol;
  const online = isSslcommerzEnabled();
  return (
    <>
      <PageHeader title="Payments" description="Transaction ledger. COD payments are recorded when staff confirm cash collection." />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-ink-600">Cash on delivery</p><p className="mt-1 font-semibold">{settings.codEnabled ? <Badge tone="green">Enabled</Badge> : <Badge>Disabled</Badge>}</p><p className="mt-1 text-xs text-ink-400">Toggle in Settings</p></Card>
        <Card className="p-5"><p className="text-sm text-ink-600">SSLCommerz (online)</p><p className="mt-1 font-semibold">{online ? <Badge tone="green">Configured</Badge> : <Badge>Not configured</Badge>}</p><p className="mt-1 text-xs text-ink-400">{online ? (process.env.SSLCOMMERZ_SANDBOX !== "false" ? "Sandbox mode" : "Live mode") : "Set SSLCOMMERZ_* secrets to enable"}</p></Card>
        <Card className="p-5"><p className="text-sm text-ink-600">Delivered but cash not recorded</p><p className="mt-1 text-xl font-bold tabular-nums">{unpaidCod[0]?.n ?? 0} · {formatMoney(unpaidCod[0]?.sum ?? 0, cur)}</p></Card>
      </div>
      {!online && <Alert tone="info" className="mb-4">Online payments are off. The SSLCommerz integration is implemented but must be tested with sandbox credentials before going live.</Alert>}
      <Table head={["Date", "Order", "Provider", "Transaction", "Amount", "Status"]} empty={rows.length === 0 && <p className="p-8 text-center text-sm text-ink-600">No transactions yet.</p>}>
        {rows.map(({ p, orderNumber }) => (
          <tr key={p.id}>
            <td className={td}>{p.createdAt.toLocaleString("en-GB")}</td>
            <td className={td}><Link href={`/admin/orders/${p.orderId}`} className="font-semibold text-brand-700 hover:underline">{orderNumber}</Link></td>
            <td className={td}>{p.provider === "cod" ? "Cash" : "SSLCommerz"}</td>
            <td className={`${td} font-mono text-xs`}>{p.transactionId}</td>
            <td className={`${td} tabular-nums`}>{formatMoney(p.amount, cur)} <span className="text-xs text-ink-400">{p.currency}</span></td>
            <td className={td}><Badge tone={p.status === "success" ? "green" : p.status === "initiated" ? "yellow" : "red"}>{p.status}</Badge></td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={Math.max(1, Math.ceil(count / per))} href={(n) => `/admin/payments?page=${n}`} />
    </>
  );
}
