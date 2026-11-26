import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "@/components/store/AuthForms";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Forgot your password?</h1>
      <p className="mt-1 text-ink-600">Enter your email and we’ll send you a link to reset it.</p>
      <div className="mt-6"><ForgotForm /></div>
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-brand-700 hover:underline">Back to sign in</Link></p>
    </>
  );
}
