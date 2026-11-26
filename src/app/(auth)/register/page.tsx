import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/store/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  return (
    <>
      <h1 className="text-3xl font-bold">Create your account</h1>
      <p className="mt-1 text-ink-600">Save addresses, track orders and reorder in seconds.</p>
      <div className="mt-6"><RegisterForm next={sp.next} /></div>
      <p className="mt-6 text-center text-sm text-ink-600">
        Already have an account? <Link href={sp.next ? `/login?next=${encodeURIComponent(sp.next)}` : "/login"} className="font-semibold text-brand-700 hover:underline">Sign in</Link>
      </p>
    </>
  );
}
