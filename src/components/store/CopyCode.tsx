"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Coupon code chip that copies itself to the clipboard. */
export function CopyCode({ code, copyLabel, copiedLabel }: { code: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard unavailable — the code is visible anyway */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-0.5 font-mono font-bold tracking-wider text-brand-700 ring-1 ring-brand-600/30 hover:ring-brand-600"
      aria-label={`${copied ? copiedLabel : copyLabel}: ${code}`}
    >
      {code}
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
    </button>
  );
}
