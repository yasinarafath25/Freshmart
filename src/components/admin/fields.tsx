"use client";

import type { ComponentProps } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { useFieldError } from "./AdminForm";

/** Input bound to the surrounding AdminForm's error state. */
export function AField({ name, label, hint, className, ...rest }: ComponentProps<"input"> & { name: string; label: string; hint?: string }) {
  const err = useFieldError(name);
  const id = `${rest.id ?? name}-${(rest.defaultValue as string | undefined) ?? ""}`.replace(/\W/g, "_").slice(0, 40);
  return (
    <Field label={label} htmlFor={id} error={err} hint={hint} className={className}>
      <Input id={id} name={name} error={err} {...rest} />
    </Field>
  );
}

export function ASelect({ name, label, children, className, ...rest }: ComponentProps<"select"> & { name: string; label: string }) {
  const err = useFieldError(name);
  const id = `${name}-sel-${String(rest.defaultValue ?? "")}`.replace(/\W/g, "_").slice(0, 40);
  return (
    <Field label={label} htmlFor={id} error={err} className={className}>
      <Select id={id} name={name} {...rest}>{children}</Select>
    </Field>
  );
}

export function ATextarea({ name, label, hint, className, ...rest }: ComponentProps<"textarea"> & { name: string; label: string; hint?: string }) {
  const err = useFieldError(name);
  const id = `${name}-ta`;
  return (
    <Field label={label} htmlFor={id} error={err} hint={hint} className={className}>
      <Textarea id={id} name={name} error={err} {...rest} />
    </Field>
  );
}
