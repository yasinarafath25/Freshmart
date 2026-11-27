import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/store/AuthForms";
import { LeafMark } from "@/components/store/Logo";
import { LangSwitch } from "@/components/store/LangSwitch";
import { getI18n } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user?.role === "staff") redirect("/admin/dashboard");
  const { next } = await searchParams;
  const { t } = await getI18n();
  return (
    <main id="main" className="relative grid min-h-dvh place-items-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 px-4">
      <LangSwitch variant="dark" className="absolute right-4 top-4" />
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-pop">
        <div className="flex items-center gap-3">
          <LeafMark className="size-10" />
          <div>
            <h1 className="text-xl font-bold">{t("Admin sign in", "অ্যাডমিন লগইন")}</h1>
            <p className="text-sm text-ink-600">{t("For shop staff only", "শুধু দোকানের স্টাফদের জন্য")}</p>
          </div>
        </div>
        {user && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{t("You are signed in as a customer. Sign in with a staff account to continue.", "আপনি গ্রাহক হিসেবে লগইন করা আছেন। চালিয়ে যেতে স্টাফ অ্যাকাউন্ট দিয়ে লগইন করুন।")}</p>}
        <div className="mt-6"><LoginForm admin next={next?.startsWith("/admin") ? next : undefined} /></div>
      </div>
    </main>
  );
}
