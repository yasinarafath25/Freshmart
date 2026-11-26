import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/store/AuthForms";
import { Alert } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.auth.resetTitle, robots: { index: false } };
}

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const { d } = await getI18n();
  return (
    <>
      <h1 className="text-3xl font-bold">{d.auth.resetTitle}</h1>
      <div className="mt-6">
        {token ? <ResetForm token={token} /> : <Alert tone="error">{d.auth.invalidLink} <Link href="/forgot-password" className="underline">{d.auth.requestNew}</Link>.</Alert>}
      </div>
    </>
  );
}
