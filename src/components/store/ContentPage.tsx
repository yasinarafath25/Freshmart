import Link from "next/link";

export function ContentPage({ title, intro, children, updated }: { title: string; intro?: string; children: React.ReactNode; updated?: string }) {
  return (
    <div className="container-page max-w-3xl py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-600">
        <Link href="/" className="hover:text-brand-700">Home</Link> / <span className="text-ink-900">{title}</span>
      </nav>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h1>
      {intro && <p className="mt-3 text-lg text-ink-600">{intro}</p>}
      {updated && <p className="mt-2 text-xs text-ink-400">Last updated: {updated}</p>}
      <div className="prose-content mt-8 space-y-5 leading-relaxed text-ink-900 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-ink-600 [&_ul]:space-y-1.5 [&_ul]:text-ink-600">
        {children}
      </div>
    </div>
  );
}
