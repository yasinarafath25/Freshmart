import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function NoAccess() {
  return (
    <Card className="mx-auto max-w-lg p-10 text-center">
      <ShieldAlert className="mx-auto size-10 text-tomato-500" aria-hidden />
      <h1 className="mt-3 text-xl font-bold">No access</h1>
      <p className="mt-1 text-ink-600">Your role doesn’t have permission to view this page. Ask a Super Admin if you need access.</p>
      <Link href="/admin/dashboard" className="mt-5 inline-block font-semibold text-brand-700 hover:underline">Back to dashboard</Link>
    </Card>
  );
}

export function StatCard({ label, value, sub, icon, tone = "green" }: { label: string; value: string; sub?: string; icon: ReactNode; tone?: "green" | "yellow" | "red" | "blue" }) {
  const tones = { green: "bg-mint-50 text-brand-700", yellow: "bg-amber-50 text-amber-700", red: "bg-red-50 text-tomato-600", blue: "bg-sky-50 text-sky-700" };
  return (
    <Card className="flex items-start gap-4 p-5">
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", tones[tone])}>{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-ink-600">{label}</p>
        <p className="mt-0.5 truncate text-2xl font-bold tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-ink-400">{sub}</p>}
      </div>
    </Card>
  );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-ink-600">
            <tr>{head.map((h, i) => <th key={i} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line">{children}</tbody>
        </table>
      </div>
      {empty}
    </Card>
  );
}

export const td = "px-4 py-3 align-middle";

export function Pager({ page, pages, href }: { page: number; pages: number; href: (n: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-end gap-2 text-sm">
      {page > 1 && <Link className="rounded-lg border border-line bg-white px-3 py-1.5 hover:border-brand-600" href={href(page - 1)}>Previous</Link>}
      <span className="text-ink-600">Page {page} of {pages}</span>
      {page < pages && <Link className="rounded-lg border border-line bg-white px-3 py-1.5 hover:border-brand-600" href={href(page + 1)}>Next</Link>}
    </nav>
  );
}

export function FilterBar({ children, action }: { children: ReactNode; action: string }) {
  return (
    <form action={action} method="get" className="mb-4 flex flex-wrap items-end gap-2 rounded-2xl border border-line bg-white p-3">
      {children}
      <button className="h-10 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">Filter</button>
      <Link href={action} className="grid h-10 place-items-center rounded-lg px-3 text-sm text-ink-600 hover:text-ink-900">Reset</Link>
    </form>
  );
}

export const filterInput = "h-10 rounded-lg border border-line bg-white px-3 text-sm focus:border-brand-600 focus:outline-none";
