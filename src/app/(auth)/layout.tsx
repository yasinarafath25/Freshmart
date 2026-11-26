import Link from "next/link";
import { Logo } from "@/components/store/Logo";
import { LangSwitch } from "@/components/store/LangSwitch";
import { getSettings } from "@/lib/services/settings";
import { getI18n } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [s, i] = await Promise.all([getSettings(), getI18n()]);
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <Logo name={s.storeName} tagline={i.lang === "bn" ? s.taglineBn : s.tagline} />
          <LangSwitch />
        </div>
        <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {children}
        </main>
        <p className="text-center text-xs text-ink-400">
          <Link href="/" className="hover:text-brand-700">{i.d.auth.backToStore}</Link>
        </p>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#e9f5df] via-[#f4faee] to-[#cfe9bd] lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/photos/banner-vegetable-basket.jpg" alt="" width={960} height={1440} className="aspect-[4/3] w-full max-w-xl rounded-3xl border-4 border-white object-cover shadow-xl" />
        <p className="mt-8 max-w-md text-center font-display text-3xl font-extrabold text-brand-900">{i.d.auth.sideTitle}</p>
        <p className="mt-2 text-center text-ink-600">{i.d.auth.sideBody}</p>
      </div>
    </div>
  );
}
