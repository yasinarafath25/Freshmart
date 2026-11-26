import { requireUserPage } from "@/lib/auth/guards";
import { AccountNav } from "@/components/store/AccountNav";
import { logoutAction } from "@/app/actions/auth";
import { getI18n } from "@/lib/i18n/server";
import { LogOut } from "lucide-react";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage("/account");
  const { d } = await getI18n();
  return (
    <div className="container-page py-8">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <span className="grid size-11 place-items-center rounded-full bg-brand-700 font-display text-lg font-bold text-white" aria-hidden>
                {user.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="truncate text-xs text-ink-600">{user.email}</p>
              </div>
            </div>
            <AccountNav />
            <form action={logoutAction} className="mt-2 border-t border-line pt-2">
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-red-50 hover:text-tomato-600">
                <LogOut className="size-4" aria-hidden /> {d.account.signOut}
              </button>
            </form>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
