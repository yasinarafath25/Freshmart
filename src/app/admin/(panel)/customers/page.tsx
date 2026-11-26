import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getSettings } from "@/lib/services/settings";
import { formatMoney } from "@/lib/utils/money";
import { FilterBar, NoAccess, PageHeader, Pager, Table, filterInput, td } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Badge } from "@/components/ui";
import { setUserStatusAction } from "@/app/admin/actions";

export const metadata = { title: "Customers" };
type SP = { q?: string; status?: string; page?: string };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { user, allowed } = await requireStaffPage("customers:read");
  if (!allowed) return <NoAccess />;
  const canWrite = hasPermission(user.permissions, "customers:write");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const per = 25;
  const conds: (SQL | undefined)[] = [eq(users.role, "customer")];
  if (sp.q) {
    const t = `%${sp.q.slice(0, 60).replace(/[%_\\]/g, (m) => "\\" + m)}%`;
    conds.push(or(ilike(users.name, t), ilike(users.email, t), ilike(users.phone, t)));
  }
  if (sp.status === "active" || sp.status === "blocked") conds.push(eq(users.status, sp.status));
  const where = and(...conds);
  const db = getDb();
  const [rows, count, settings] = await Promise.all([
    db
      .select({
        u: users,
        orders: sql<number>`(select count(*)::int from orders o where o.user_id = ${users.id})`,
        spent: sql<number>`(select coalesce(sum(total),0)::int from orders o where o.user_id = ${users.id} and o.status <> 'cancelled')`,
        lastOrder: sql<Date | null>`(select max(created_at) from orders o where o.user_id = ${users.id})`,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(per)
      .offset((page - 1) * per),
    db.$count(users, where),
    getSettings(),
  ]);
  return (
    <>
      <PageHeader title="Customers" description={`${count} customers`} />
      <FilterBar action="/admin/customers">
        <input name="q" defaultValue={sp.q} placeholder="Name, email or phone" className={`${filterInput} w-64`} aria-label="Search customers" />
        <select name="status" defaultValue={sp.status ?? ""} className={filterInput} aria-label="Status"><option value="">Any status</option><option value="active">Active</option><option value="blocked">Blocked</option></select>
      </FilterBar>
      <Table head={["Customer", "Phone", "Orders", "Spent", "Joined", "Status", ""]} empty={rows.length === 0 && <p className="p-8 text-center text-sm text-ink-600">No customers found.</p>}>
        {rows.map(({ u, orders, spent, lastOrder }) => (
          <tr key={u.id}>
            <td className={td}><p className="font-semibold">{u.name}</p><p className="text-xs text-ink-400">{u.email}</p></td>
            <td className={td}>{u.phone ?? "—"}</td>
            <td className={`${td} tabular-nums`}>{orders}{lastOrder && <span className="block text-xs text-ink-400">last {new Date(lastOrder).toLocaleDateString("en-GB")}</span>}</td>
            <td className={`${td} tabular-nums`}>{formatMoney(spent, settings.currencySymbol)}</td>
            <td className={td}>{u.createdAt.toLocaleDateString("en-GB")}</td>
            <td className={td}>{u.status === "active" ? <Badge tone="green">Active</Badge> : <Badge tone="red">Blocked</Badge>}</td>
            <td className={`${td} text-right`}>
              {canWrite && (
                <form action={setUserStatusAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="status" value={u.status === "active" ? "blocked" : "active"} />
                  {u.status === "active" ? <ConfirmButton message={`Block ${u.name}? They will be signed out and unable to log in.`}>Block</ConfirmButton> : <button className="font-semibold text-brand-700 hover:underline">Unblock</button>}
                </form>
              )}
            </td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={Math.max(1, Math.ceil(count / per))} href={(n) => `/admin/customers?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([, x]) => x)), page: String(n) })}`} />
    </>
  );
}
