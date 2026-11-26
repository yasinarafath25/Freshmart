import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/store/AuthForms";
import { Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-bold">Set a new password</h1>
      <div className="mt-6">
        {token ? <ResetForm token={token} /> : <Alert tone="error">This reset link is invalid. <Link href="/forgot-password" className="underline">Request a new one</Link>.</Alert>}
      </div>
    </>
  );
}
