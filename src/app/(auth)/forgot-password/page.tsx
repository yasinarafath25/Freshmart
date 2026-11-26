import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "@/components/store/AuthForms";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.auth.forgotTitle, robots: { index: false } };
}

export default async function ForgotPage() {
  const { d } = await getI18n();
  return (
    <>
      <h1 className="text-3xl font-bold">{d.auth.forgotTitle}</h1>
      <p className="mt-1 text-ink-600">{d.auth.forgotBody}</p>
      <div className="mt-6"><ForgotForm /></div>
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-brand-700 hover:underline">{d.auth.backToSignIn}</Link></p>
    </>
  );
}
