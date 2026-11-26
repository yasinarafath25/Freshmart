import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/store/AuthForms";
import { LeafMark } from "@/components/store/Logo";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user?.role === "staff") redirect("/admin/dashboard");
  const { next } = await searchParams;
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-brand-900 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-pop">
        <div className="flex items-center gap-3">
          <LeafMark className="size-10" />
          <div>
            <h1 className="text-xl font-bold">Admin sign in</h1>
            <p className="text-sm text-ink-600">Staff accounts only</p>
          </div>
        </div>
        {user && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">You are signed in as a customer. Sign in with a staff account to continue.</p>}
        <div className="mt-6"><LoginForm admin next={next?.startsWith("/admin") ? next : undefined} /></div>
      </div>
    </main>
  );
}
