import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { getI18n } from "@/lib/i18n/server";

export function PageHeader({ title, description, actions, back }: { title: string; description?: string; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6">
      {back && <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-ink-600 hover:text-brand-700">← {back.label}</Link>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ink-900 sm:text-[28px]">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-ink-600 sm:text-[15px]">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export async function NoAccess() {
  const { t } = await getI18n();
  return (
    <Card className="mx-auto max-w-lg p-10 text-center">
      <ShieldAlert className="mx-auto size-10 text-tomato-500" aria-hidden />
      <h1 className="mt-3 text-xl font-bold">{t("No access", "অনুমতি নেই")}</h1>
      <p className="mt-1 text-ink-600">{t("Your role doesn’t have permission to view this page. Ask a Super Admin if you need access.", "এই পেজ দেখার অনুমতি আপনার রোলে নেই। দরকার হলে সুপার অ্যাডমিনকে বলুন।")}</p>
      <Link href="/admin/dashboard" className="mt-5 inline-block font-semibold text-brand-700 hover:underline">{t("Back to dashboard", "ড্যাশবোর্ডে ফিরে যান")}</Link>
    </Card>
  );
}

const TONES = {
  green: { icon: "bg-brand-700 text-white", ring: "" },
  yellow: { icon: "bg-sun-400 text-ink-900", ring: "" },
  red: { icon: "bg-tomato-500 text-white", ring: "" },
  blue: { icon: "bg-sky-600 text-white", ring: "" },
  purple: { icon: "bg-violet-600 text-white", ring: "" },
};

export function StatCard({ label, value, sub, icon, tone = "green", className }: { label: string; value: string; sub?: string; icon: ReactNode; tone?: keyof typeof TONES; className?: string }) {
  return (
    <Card className={cn("flex items-start gap-4 p-5 transition hover:shadow-md", className)}>
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl shadow-sm", TONES[tone].icon)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-600">{label}</p>
        <p className="mt-0.5 truncate text-2xl font-bold tabular-nums text-ink-900">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-ink-400">{sub}</p>}
      </div>
    </Card>
  );
}

/** Friendly empty state used inside tables and cards. */
export function EmptyBlock({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-mint-50 text-brand-700">{icon}</span>
      <p className="mt-3 font-semibold text-ink-900">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-600">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line bg-[#f8faf7] text-left text-xs font-semibold uppercase tracking-wide text-ink-600">
            <tr>{head.map((h, i) => <th key={i} scope="col" className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line">{children}</tbody>
        </table>
      </div>
      {empty}
    </Card>
  );
}

export const td = "px-4 py-3.5 align-middle";

export async function Pager({ page, pages, href }: { page: number; pages: number; href: (n: number) => string }) {
  if (pages <= 1) return null;
  const { t, num } = await getI18n();
  const btn = "rounded-lg border border-line bg-white px-3 py-1.5 font-medium hover:border-brand-600 hover:text-brand-700";
  return (
    <nav aria-label={t("Pagination", "পেজ")} className="mt-4 flex items-center justify-end gap-2 text-sm">
      {page > 1 && <Link className={btn} href={href(page - 1)}>← {t("Previous", "আগের")}</Link>}
      <span className="text-ink-600">{t(`Page ${page} of ${pages}`, `পেজ ${num(page)} / ${num(pages)}`)}</span>
      {page < pages && <Link className={btn} href={href(page + 1)}>{t("Next", "পরের")} →</Link>}
    </nav>
  );
}

export async function FilterBar({ children, action }: { children: ReactNode; action: string }) {
  const { t } = await getI18n();
  return (
    <form action={action} method="get" className="mb-4 flex flex-wrap items-end gap-2 rounded-2xl border border-line bg-white p-3 shadow-sm">
      {children}
      <button className="h-10 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">{t("Search", "খুঁজুন")}</button>
      <Link href={action} className="grid h-10 place-items-center rounded-lg px-3 text-sm text-ink-600 hover:text-ink-900">{t("Clear", "মুছুন")}</Link>
    </form>
  );
}

export const filterInput = "h-10 rounded-lg border border-line bg-white px-3 text-sm focus:border-brand-600 focus:outline-none";
