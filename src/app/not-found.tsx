import Link from "next/link";
import { LeafMark } from "@/components/store/Logo";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { d, num } = await getI18n();
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-canvas px-4 text-center">
      <div>
        <LeafMark className="mx-auto size-16" />
        <p className="mt-6 font-display text-6xl font-extrabold text-brand-700">{num("404")}</p>
        <h1 className="mt-2 text-2xl font-bold">{d.errors.notFoundTitle}</h1>
        <p className="mt-2 text-ink-600">{d.errors.notFoundBody}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">{d.errors.goHome}</Link>
          <Link href="/shop" className="rounded-xl border border-line bg-white px-5 py-3 font-semibold hover:border-brand-600">{d.errors.browse}</Link>
        </div>
      </div>
    </main>
  );
}
