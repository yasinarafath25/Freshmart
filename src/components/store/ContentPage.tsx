import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";

export async function ContentPage({ title, intro, children, updated }: { title: string; intro?: string; children: React.ReactNode; updated?: string }) {
  const i = await getI18n();
  return (
    <div className="container-page max-w-3xl py-10">
      <nav aria-label={i.d.catalog.breadcrumb} className="text-sm text-ink-600">
        <Link href="/" className="hover:text-brand-700">{i.d.common.home}</Link> / <span className="text-ink-900">{title}</span>
      </nav>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h1>
      {intro && <p className="mt-3 text-lg text-ink-600">{intro}</p>}
      {updated && <p className="mt-2 text-xs text-ink-400">{i.lang === "bn" ? "সর্বশেষ হালনাগাদ" : "Last updated"}: {updated}</p>}
      <div className="mt-8 space-y-5 leading-relaxed text-ink-900 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-ink-600 [&_ul]:space-y-1.5 [&_ul]:text-ink-600">
        {children}
      </div>
    </div>
  );
}
