"use client";

import { startTransition, type FormEvent } from "react";

/**
 * React 19 resets uncontrolled form fields after a form action completes, which would wipe the
 * user's input when the server returns validation errors. This submit handler dispatches the
 * action manually (no reset). The form keeps its `action` prop so it still works before hydration.
 */
export function keepValues(dispatch: (fd: FormData) => void, confirmMessage?: string) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    startTransition(() => dispatch(fd));
  };
}
