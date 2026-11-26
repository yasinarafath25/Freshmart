import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/store/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";
import { Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  return (
    <>
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="mt-1 text-ink-600">Sign in to check out faster and track your orders.</p>
      {sp.reset && <Alert tone="success" className="mt-5">Password updated. Please sign in with your new password.</Alert>}
      <div className="mt-6"><LoginForm next={sp.next} /></div>
      <p className="mt-6 text-center text-sm text-ink-600">
        New here? <Link href={sp.next ? `/register?next=${encodeURIComponent(sp.next)}` : "/register"} className="font-semibold text-brand-700 hover:underline">Create an account</Link>
      </p>
    </>
  );
}
