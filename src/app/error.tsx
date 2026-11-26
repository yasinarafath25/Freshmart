"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { d } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold">{d.errors.wrong}</h1>
        <p className="mt-2 text-ink-600">
          {d.errors.wrongBody}
          {error.digest ? ` (ref ${error.digest})` : ""}.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">{d.errors.tryAgain}</button>
          <Link href="/" className="rounded-xl border border-line px-5 py-3 font-semibold">{d.errors.goHome}</Link>
        </div>
      </div>
    </main>
  );
}
