import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/store/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { Alert } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.auth.signIn, robots: { index: false } };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  const { d } = await getI18n();
  return (
    <>
      <h1 className="text-3xl font-bold">{d.auth.welcome}</h1>
      <p className="mt-1 text-ink-600">{d.auth.welcomeBody}</p>
      {sp.reset && <Alert tone="success" className="mt-5">{d.auth.resetDone}</Alert>}
      <div className="mt-6"><LoginForm next={sp.next} /></div>
      <p className="mt-6 text-center text-sm text-ink-600">
        {d.auth.newHere} <Link href={sp.next ? `/register?next=${encodeURIComponent(sp.next)}` : "/register"} className="font-semibold text-brand-700 hover:underline">{d.auth.create}</Link>
      </p>
    </>
  );
}
