import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/store/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.auth.create, robots: { index: false } };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  const { d } = await getI18n();
  return (
    <>
      <h1 className="text-3xl font-bold">{d.auth.createTitle}</h1>
      <p className="mt-1 text-ink-600">{d.auth.createBody}</p>
      <div className="mt-6"><RegisterForm next={sp.next} /></div>
      <p className="mt-6 text-center text-sm text-ink-600">
        {d.auth.haveAccount} <Link href={sp.next ? `/login?next=${encodeURIComponent(sp.next)}` : "/login"} className="font-semibold text-brand-700 hover:underline">{d.auth.signIn}</Link>
      </p>
    </>
  );
}
