"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-ink-600">Please try again. If the problem continues, contact support{error.digest ? ` (ref ${error.digest})` : ""}.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">Try again</button>
          <Link href="/" className="rounded-xl border border-line px-5 py-3 font-semibold">Go home</Link>
        </div>
      </div>
    </main>
  );
}
