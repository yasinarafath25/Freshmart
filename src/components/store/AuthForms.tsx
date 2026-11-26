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

function PasswordInput({ id, name, error, autoComplete }: { id: string; name: string; error?: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} name={name} type={show ? "text" : "password"} required autoComplete={autoComplete} error={error} className="pr-12" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-1 top-1 grid size-9 place-items-center rounded-lg text-ink-400 hover:text-ink-900" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function LoginForm({ next, admin }: { next?: string; admin?: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(admin ? adminLoginAction : loginAction, null);
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      <Field label="Email" htmlFor="email" error={state?.errors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} error={state?.errors?.email} />
      </Field>
      <Field label="Password" htmlFor="password" error={state?.errors?.password}>
        <PasswordInput id="password" name="password" autoComplete="current-password" error={state?.errors?.password} />
      </Field>
      <div className="flex items-center justify-between">
        <Checkbox name="remember" label="Remember me" defaultChecked />
        {!admin && (
          <Link href="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
            Forgot password?
          </Link>
        )}
      </div>
      <Button size="lg" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(registerAction, null);
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      <Field label="Full name" htmlFor="name" error={state?.errors?.name}>
        <Input id="name" name="name" autoComplete="name" required defaultValue={state?.values?.name} error={state?.errors?.name} />
      </Field>
      <Field label="Email" htmlFor="email" error={state?.errors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} error={state?.errors?.email} />
      </Field>
      <Field label="Phone (optional)" htmlFor="phone" error={state?.errors?.phone} hint="For delivery updates">
        <Input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={state?.values?.phone} error={state?.errors?.phone} />
      </Field>
      <Field label="Password" htmlFor="password" error={state?.errors?.password} hint="At least 8 characters with a letter and a number">
        <PasswordInput id="password" name="password" autoComplete="new-password" error={state?.errors?.password} />
      </Field>
      <div>
        <Checkbox
          name="terms"
          label={
            <span>
              I agree to the <Link href="/terms" className="text-brand-700 underline">Terms</Link> and <Link href="/privacy-policy" className="text-brand-700 underline">Privacy Policy</Link>
            </span>
          }
        />
        {state?.errors?.terms && <p className="mt-1 text-sm text-tomato-600">{state.errors.terms}</p>}
      </div>
      <Button size="lg" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordResetAction, null);
  if (state?.ok) return <Alert tone="success">{state.message}</Alert>;
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      <Field label="Email" htmlFor="email" error={state?.errors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required error={state?.errors?.email} />
      </Field>
      <Button size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(resetPasswordAction, null);
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      <Field label="New password" htmlFor="password" error={state?.errors?.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" error={state?.errors?.password} />
      </Field>
      <Field label="Confirm password" htmlFor="confirm" error={state?.errors?.confirm}>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" error={state?.errors?.confirm} />
      </Field>
      <Button size="lg" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
