"use client";

import { createContext, useActionState, useContext, useEffect, useRef } from "react";
import type { AdminState } from "@/app/admin/actions";
import { Alert, Button } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { keepValues } from "@/lib/utils/form";
import { useI18n } from "@/lib/i18n/client";

const ErrorsCtx = createContext<Record<string, string>>({});
/** Field-level error for the nearest AdminForm. */
export function useFieldError(name: string) {
  return useContext(ErrorsCtx)[name];
}

export function FieldError({ name }: { name: string }) {
  const e = useFieldError(name);
  return e ? <p className="mt-1 text-sm text-tomato-600" role="alert">{e}</p> : null;
}

/** Generic admin form: shows success/error messages and field errors; resets on success when `resetOnSuccess`. */
export function AdminForm({
  action,
  children,
  submitLabel,
  className,
  resetOnSuccess,
}: {
  action: (state: AdminState, fd: FormData) => Promise<AdminState>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [raw, formAction, pending] = useActionState<AdminState, FormData>(action, null);
  const { t, st } = useI18n();
  const state = st(raw);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <ErrorsCtx.Provider value={state?.errors ?? {}}>
      <form ref={ref} action={formAction} onSubmit={keepValues(formAction)} className={cn("space-y-4", className)}>
        {children}
        {state?.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}
        {!state?.message && state?.errors && Object.keys(state.errors).length > 0 && <Alert tone="error">{t("Please fix the highlighted fields.", "চিহ্নিত ঘরগুলো ঠিক করুন।")}</Alert>}
        <Button disabled={pending}>{pending ? t("Saving…", "সংরক্ষণ হচ্ছে…") : (submitLabel ?? t("Save", "সংরক্ষণ করুন"))}</Button>
      </form>
    </ErrorsCtx.Provider>
  );
}
