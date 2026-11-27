import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getI18n } from "@/lib/i18n/server";
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
  const [rows, count, { t, money, num, date }] = await Promise.all([
    db
      .select({
        u: users,
        orders: sql<number>`(select count(*)::int from orders o where o.user_id = "users"."id")`,
        spent: sql<number>`(select coalesce(sum(total),0)::int from orders o where o.user_id = "users"."id" and o.status <> 'cancelled')`,
        lastOrder: sql<Date | null>`(select max(created_at) from orders o where o.user_id = "users"."id")`,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(per)
      .offset((page - 1) * per),
    db.$count(users, where),
    getI18n(),
  ]);
  return (
    <>
      <PageHeader title={t("Customers", "গ্রাহক")} description={t(`${count} customers have signed up.`, `মোট ${num(count)} জন গ্রাহক অ্যাকাউন্ট খুলেছেন।`)} />
      <FilterBar action="/admin/customers">
        <input name="q" defaultValue={sp.q} placeholder={t("Name, email or phone", "নাম, ইমেইল বা ফোন")} className={`${filterInput} w-full sm:w-64`} aria-label={t("Search customers", "গ্রাহক খুঁজুন")} />
        <select name="status" defaultValue={sp.status ?? ""} className={filterInput} aria-label={t("Status", "অবস্থা")}><option value="">{t("Any status", "সব")}</option><option value="active">{t("Active", "সক্রিয়")}</option><option value="blocked">{t("Blocked", "ব্লক করা")}</option></select>
      </FilterBar>
      <Table head={[t("Customer", "গ্রাহক"), t("Phone", "ফোন"), t("Orders", "অর্ডার"), t("Spent", "মোট কেনা"), t("Joined", "যোগদান"), t("Status", "অবস্থা"), ""]} empty={rows.length === 0 && <p className="p-8 text-center text-sm text-ink-600">{t("No customers found.", "কোনো গ্রাহক পাওয়া যায়নি।")}</p>}>
        {rows.map(({ u, orders, spent, lastOrder }) => (
          <tr key={u.id}>
            <td className={td}><p className="font-semibold">{u.name}</p><p className="text-xs text-ink-400">{u.email}</p></td>
            <td className={td}>{u.phone ?? "—"}</td>
            <td className={`${td} tabular-nums`}>{num(orders)}{lastOrder && <span className="block text-xs text-ink-400">{t("last", "সর্বশেষ")} {date(new Date(lastOrder))}</span>}</td>
            <td className={`${td} tabular-nums`}>{money(spent)}</td>
            <td className={td}>{date(u.createdAt)}</td>
            <td className={td}>{u.status === "active" ? <Badge tone="green">{t("Active", "সক্রিয়")}</Badge> : <Badge tone="red">{t("Blocked", "ব্লক করা")}</Badge>}</td>
            <td className={`${td} text-right`}>
              {canWrite && (
                <form action={setUserStatusAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="status" value={u.status === "active" ? "blocked" : "active"} />
                  {u.status === "active" ? <ConfirmButton message={t(`Block ${u.name}? They will be signed out and unable to log in.`, `${u.name}-কে ব্লক করবেন? তিনি আর লগইন করতে পারবেন না।`)}>{t("Block", "ব্লক")}</ConfirmButton> : <button className="font-semibold text-brand-700 hover:underline">{t("Unblock", "আনব্লক")}</button>}
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
