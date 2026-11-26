import Link from "next/link";
import { Logo } from "@/components/store/Logo";
import { getSettings } from "@/lib/services/settings";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Logo name={s.storeName} tagline={s.tagline} />
        <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {children}
        </main>
        <p className="text-center text-xs text-ink-400">
          <Link href="/" className="hover:text-brand-700">← Back to store</Link>
        </p>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#e9f5df] via-[#f4faee] to-[#cfe9bd] lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/hero-basket.svg" alt="" width={640} height={320} className="w-full max-w-xl drop-shadow-xl" />
        <p className="mt-8 max-w-md text-center font-display text-3xl font-extrabold text-brand-900">Fresh from the farm to your kitchen.</p>
        <p className="mt-2 text-center text-ink-600">Same-day delivery · Cash on delivery · 100% freshness guarantee</p>
      </div>
    </div>
  );
}
