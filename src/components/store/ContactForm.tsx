"use client";

import { useActionState } from "react";
import { sendContactMessageAction, type FormState } from "@/app/actions/misc";
import { Alert, Button, Field, Input, Textarea } from "@/components/ui";
import { keepValues } from "@/lib/utils/form";
import { useI18n } from "@/lib/i18n/client";

export function ContactForm() {
  const { d, st } = useI18n();
  const [raw, action, pending] = useActionState<FormState, FormData>(sendContactMessageAction, null);
  const state = st(raw);
  const c = d.contact;
  if (state?.ok) return <Alert tone="success">{state.message}</Alert>;
  const e = state?.errors ?? {};
  return (
    <form action={action} onSubmit={keepValues(action)} className="grid gap-4 sm:grid-cols-2" noValidate>
      {state?.message && <Alert tone="error" className="sm:col-span-2">{state.message}</Alert>}
      <Field label={c.name} htmlFor="c-name" error={e.name}><Input id="c-name" name="name" required autoComplete="name" error={e.name} /></Field>
      <Field label={c.email} htmlFor="c-email" error={e.email}><Input id="c-email" name="email" type="email" required autoComplete="email" error={e.email} /></Field>
      <Field label={c.phone} htmlFor="c-phone"><Input id="c-phone" name="phone" type="tel" autoComplete="tel" /></Field>
      <Field label={c.subject} htmlFor="c-subject" error={e.subject}><Input id="c-subject" name="subject" required error={e.subject} /></Field>
      <Field label={c.message} htmlFor="c-message" error={e.message} className="sm:col-span-2"><Textarea id="c-message" name="message" required className="min-h-36" error={e.message} /></Field>
      <div className="sm:col-span-2"><Button disabled={pending}>{pending ? c.sending : c.send}</Button></div>
    </form>
  );
}
