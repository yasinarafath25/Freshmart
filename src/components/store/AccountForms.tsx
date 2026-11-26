"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction, saveAddressAction, updateProfileAction, cancelMyOrderAction, type AccountState } from "@/app/actions/account";
import { Alert, Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { keepValues } from "@/lib/utils/form";
import { useI18n } from "@/lib/i18n/client";

export function ProfileForm({ name, phone, email }: { name: string; phone: string | null; email: string }) {
  const { d, st } = useI18n();
  const a = d.account;
  const [raw, action, pending] = useActionState<AccountState, FormData>(updateProfileAction, null);
  const state = st(raw);
  return (
    <form action={action} onSubmit={keepValues(action)} className="grid gap-4 sm:grid-cols-2">
      <Field label={a.fullName} htmlFor="name" error={state?.errors?.name}>
        <Input id="name" name="name" defaultValue={name} required error={state?.errors?.name} autoComplete="name" />
      </Field>
      <Field label={d.checkout.phone} htmlFor="phone" error={state?.errors?.phone}>
        <Input id="phone" name="phone" type="tel" defaultValue={phone ?? ""} error={state?.errors?.phone} autoComplete="tel" />
      </Field>
      <Field label={a.email} htmlFor="email-ro" hint={a.emailHint} className="sm:col-span-2">
        <Input id="email-ro" value={email} disabled readOnly />
      </Field>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button disabled={pending}>{pending ? d.common.saving : a.saveChanges}</Button>
        {state?.ok && <span className="text-sm text-brand-700" role="status">{state.message}</span>}
      </div>
    </form>
  );
}

export function PasswordForm() {
  const { d, st } = useI18n();
  const a = d.account;
  const [raw, action, pending] = useActionState<AccountState, FormData>(changePasswordAction, null);
  const state = st(raw);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (raw?.ok) ref.current?.reset();
  }, [raw]);
  return (
    <form ref={ref} action={action} onSubmit={keepValues(action)} className="grid gap-4 sm:grid-cols-3">
      <Field label={a.current} htmlFor="current" error={state?.errors?.current}>
        <Input id="current" name="current" type="password" required autoComplete="current-password" error={state?.errors?.current} />
      </Field>
      <Field label={a.newPassword} htmlFor="new-password" error={state?.errors?.password}>
        <Input id="new-password" name="password" type="password" required autoComplete="new-password" error={state?.errors?.password} />
      </Field>
      <Field label={a.confirmNew} htmlFor="confirm" error={state?.errors?.confirm}>
        <Input id="confirm" name="confirm" type="password" required autoComplete="new-password" error={state?.errors?.confirm} />
      </Field>
      <div className="flex items-center gap-3 sm:col-span-3">
        <Button disabled={pending}>{pending ? a.updating : a.changePassword}</Button>
        {state?.ok && <span className="text-sm text-brand-700" role="status">{state.message}</span>}
      </div>
    </form>
  );
}

export type AddressValues = {
  id?: string;
  label?: string;
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  area?: string;
  city?: string;
  postalCode?: string | null;
  zoneId?: string | null;
  isDefault?: boolean;
};

export function AddressForm({ zones, initial, onDone }: { zones: { id: string; name: string }[]; initial?: AddressValues; onDone?: () => void }) {
  const { d, lang, st } = useI18n();
  const a = d.account;
  const c = d.checkout;
  const [raw, action, pending] = useActionState<AccountState, FormData>(saveAddressAction, null);
  const state = st(raw);
  useEffect(() => {
    if (raw?.ok) onDone?.();
  }, [raw, onDone]);
  const e = state?.errors ?? {};
  const k = initial?.id ?? "new";
  return (
    <form action={action} onSubmit={keepValues(action)} className="grid gap-4 sm:grid-cols-2">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      {state?.message && !state.ok && <Alert tone="error" className="sm:col-span-2">{state.message}</Alert>}
      <Field label={c.recipient} htmlFor={`fullName-${k}`} error={e.fullName}>
        <Input id={`fullName-${k}`} name="fullName" defaultValue={initial?.fullName} required error={e.fullName} autoComplete="name" />
      </Field>
      <Field label={c.phone} htmlFor={`phone-${k}`} error={e.phone}>
        <Input id={`phone-${k}`} name="phone" type="tel" inputMode="tel" defaultValue={initial?.phone} required error={e.phone} autoComplete="tel" />
      </Field>
      <Field label={c.line1} htmlFor={`line1-${k}`} error={e.line1} className="sm:col-span-2">
        <Input id={`line1-${k}`} name="line1" defaultValue={initial?.line1} required error={e.line1} autoComplete="address-line1" />
      </Field>
      <Field label={c.line2} htmlFor={`line2-${k}`} className="sm:col-span-2">
        <Input id={`line2-${k}`} name="line2" defaultValue={initial?.line2 ?? ""} autoComplete="address-line2" />
      </Field>
      <Field label={c.area} htmlFor={`area-${k}`} error={e.area}>
        <Input id={`area-${k}`} name="area" defaultValue={initial?.area} required error={e.area} />
      </Field>
      <Field label={c.city} htmlFor={`city-${k}`} error={e.city}>
        <Input id={`city-${k}`} name="city" defaultValue={initial?.city ?? (lang === "bn" ? "করিমগঞ্জ" : "Karimganj")} required error={e.city} autoComplete="address-level2" />
      </Field>
      <Field label={a.deliveryArea} htmlFor={`zone-${k}`} error={e.zoneId}>
        <Select id={`zone-${k}`} name="zoneId" defaultValue={initial?.zoneId ?? ""} required>
          <option value="" disabled>{a.selectArea}</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </Select>
      </Field>
      <Field label={c.postal} htmlFor={`postal-${k}`}>
        <Input id={`postal-${k}`} name="postalCode" defaultValue={initial?.postalCode ?? ""} inputMode="numeric" autoComplete="postal-code" />
      </Field>
      <Field label={a.label} htmlFor={`label-${k}`}>
        <Select id={`label-${k}`} name="label" defaultValue={initial?.label ?? "Home"}>
          {(["Home", "Work", "Other"] as const).map((l) => (
            <option key={l} value={l}>{a.labels[l]}</option>
          ))}
        </Select>
      </Field>
      <div className="flex items-end pb-2">
        <Checkbox name="isDefault" label={a.setDefault} defaultChecked={initial?.isDefault} />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button disabled={pending}>{pending ? d.common.saving : a.saveAddress}</Button>
        {state?.ok && <span className="text-sm text-brand-700" role="status">{state.message}</span>}
      </div>
    </form>
  );
}

export function CancelOrderForm({ orderId }: { orderId: string }) {
  const { d, st } = useI18n();
  const o = d.order;
  const [raw, action, pending] = useActionState<AccountState, FormData>(cancelMyOrderAction, null);
  const state = st(raw);
  if (state?.ok) return <Alert tone="success">{state.message}</Alert>;
  return (
    <details className="rounded-2xl border border-line p-4">
      <summary className="cursor-pointer text-sm font-semibold text-tomato-600">{o.cancel}</summary>
      <form action={action} className="mt-3 space-y-3" onSubmit={keepValues(action, o.cancelConfirm)}>
        <input type="hidden" name="orderId" value={orderId} />
        <Field label={o.reason} htmlFor="reason">
          <Textarea id="reason" name="reason" maxLength={200} className="min-h-16" />
        </Field>
        {state?.message && <Alert tone="error">{state.message}</Alert>}
        <Button variant="danger" size="sm" disabled={pending}>{pending ? o.cancelling : o.confirmCancel}</Button>
      </form>
    </details>
  );
}
