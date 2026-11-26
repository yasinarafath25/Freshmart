"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { subscribeNewsletterAction, type FormState } from "@/app/actions/misc";
import { keepValues } from "@/lib/utils/form";
import { useI18n } from "@/lib/i18n/client";

export function Newsletter() {
  const { d, st } = useI18n();
  const [raw, action, pending] = useActionState<FormState, FormData>(subscribeNewsletterAction, null);
  const state = st(raw);
  const n = d.newsletter;
  return (
    <section className="container-page py-12" aria-labelledby="newsletter-title">
      <div className="relative overflow-hidden rounded-3xl bg-brand-900 px-6 py-10 text-white sm:px-12">
        <div className="absolute -right-10 -top-16 size-64 rounded-full bg-leaf-500/25 blur-2xl" aria-hidden />
        <div className="absolute -bottom-20 left-1/3 size-56 rounded-full bg-lime-400/15 blur-2xl" aria-hidden />
        <div className="relative grid items-center gap-6 lg:grid-cols-2">
          <div>
            <h2 id="newsletter-title" className="text-2xl font-bold sm:text-3xl">
              {n.title}
            </h2>
            <p className="mt-2 text-white/75">{n.body}</p>
          </div>
          <form action={action} onSubmit={keepValues(action)} className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="nl-email" className="sr-only">
                {n.emailLabel}
              </label>
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-400" aria-hidden />
                <input
                  id="nl-email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-xl border-0 bg-white pl-12 pr-4 text-ink-900 placeholder:text-ink-400 focus:ring-4 focus:ring-lime-400/50 focus:outline-none"
                />
              </div>
              <button disabled={pending} className="h-12 rounded-xl bg-sun-400 px-7 font-semibold text-brand-900 transition hover:bg-sun-300 disabled:opacity-60">
                {pending ? n.subscribing : n.subscribe}
              </button>
            </div>
            <p aria-live="polite" className={`min-h-5 text-sm ${state?.ok ? "text-lime-400" : "text-red-200"}`}>
              {state?.message}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
