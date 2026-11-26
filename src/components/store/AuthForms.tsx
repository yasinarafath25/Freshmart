"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  adminLoginAction,
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
  type AuthState,
} from "@/app/actions/auth";
import { Alert, Button, Checkbox, Field, Input } from "@/components/ui";
import { keepValues } from "@/lib/utils/form";
import { useI18n } from "@/lib/i18n/client";

function PasswordInput({ id, name, error, autoComplete }: { id: string; name: string; error?: string; autoComplete: string }) {
  const { d } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} name={name} type={show ? "text" : "password"} required autoComplete={autoComplete} error={error} className="pr-12" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-1 top-1 grid size-9 place-items-center rounded-lg text-ink-400 hover:text-ink-900" aria-label={show ? d.auth.hide : d.auth.show}>
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function LoginForm({ next, admin }: { next?: string; admin?: boolean }) {
  const { d, st } = useI18n();
  const a = d.auth;
  const [raw, action, pending] = useActionState<AuthState, FormData>(admin ? adminLoginAction : loginAction, null);
  const state = st(raw);
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      <Field label={a.email} htmlFor="email" error={state?.errors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} error={state?.errors?.email} />
      </Field>
      <Field label={a.password} htmlFor="password" error={state?.errors?.password}>
        <PasswordInput id="password" name="password" autoComplete="current-password" error={state?.errors?.password} />
      </Field>
      <div className="flex items-center justify-between">
        <Checkbox name="remember" label={a.remember} defaultChecked />
        {!admin && (
          <Link href="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
            {a.forgot}
          </Link>
        )}
      </div>
      <Button size="lg" className="w-full" disabled={pending}>
        {pending ? a.signingIn : a.signIn}
      </Button>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const { d, st } = useI18n();
  const a = d.auth;
  const [raw, action, pending] = useActionState<AuthState, FormData>(registerAction, null);
  const state = st(raw);
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      <Field label={a.fullName} htmlFor="name" error={state?.errors?.name}>
        <Input id="name" name="name" autoComplete="name" required defaultValue={state?.values?.name} error={state?.errors?.name} />
      </Field>
      <Field label={a.email} htmlFor="email" error={state?.errors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} error={state?.errors?.email} />
      </Field>
      <Field label={a.phone} htmlFor="phone" error={state?.errors?.phone} hint={a.phoneHint}>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={state?.values?.phone} error={state?.errors?.phone} />
      </Field>
      <Field label={a.password} htmlFor="password" error={state?.errors?.password} hint={a.pwHint}>
        <PasswordInput id="password" name="password" autoComplete="new-password" error={state?.errors?.password} />
      </Field>
      <div>
        <Checkbox
          name="terms"
          label={
            <span>
              {a.agree[0]} <Link href="/terms" className="text-brand-700 underline">{a.agree[1]}</Link> {a.agree[2]}{" "}
              <Link href="/privacy-policy" className="text-brand-700 underline">{a.agree[3]}</Link>
            </span>
          }
        />
        {state?.errors?.terms && <p className="mt-1 text-sm text-tomato-600">{state.errors.terms}</p>}
      </div>
      <Button size="lg" className="w-full" disabled={pending}>
        {pending ? a.creating : a.createBtn}
      </Button>
    </form>
  );
}

export function ForgotForm() {
  const { d, st } = useI18n();
  const [raw, action, pending] = useActionState<AuthState, FormData>(requestPasswordResetAction, null);
  const state = st(raw);
  if (state?.ok) return <Alert tone="success">{state.message}</Alert>;
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      <Field label={d.auth.email} htmlFor="email" error={state?.errors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required error={state?.errors?.email} />
      </Field>
      <Button size="lg" className="w-full" disabled={pending}>
        {pending ? d.auth.sending : d.auth.sendLink}
      </Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const { d, st } = useI18n();
  const [raw, action, pending] = useActionState<AuthState, FormData>(resetPasswordAction, null);
  const state = st(raw);
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      <Field label={d.auth.newPassword} htmlFor="password" error={state?.errors?.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" error={state?.errors?.password} />
      </Field>
      <Field label={d.auth.confirm} htmlFor="confirm" error={state?.errors?.confirm}>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" error={state?.errors?.confirm} />
      </Field>
      <Button size="lg" className="w-full" disabled={pending}>
        {pending ? d.common.saving : d.auth.setPassword}
      </Button>
    </form>
  );
}
