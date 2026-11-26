"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Banknote, CreditCard, Loader2, Lock, MapPin, TicketPercent } from "lucide-react";
import { placeOrderAction, previewCheckoutAction, type CheckoutState, type QuoteResult } from "@/app/actions/checkout";
import { Alert, Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { keepValues } from "@/lib/utils/form";

type Address = { id: string; label: string; fullName: string; phone: string; line1: string; line2: string | null; area: string; city: string; postalCode: string | null; zoneId: string | null; isDefault: boolean };
type Zone = { id: string; name: string; etaText: string; fee: number };
type Line = { variantId: string; productName: string; variantName: string; quantity: number; lineTotal: number; image: string | null };

function fmt(minor: number, cur: string) {
  return `${cur}${(minor / 100).toLocaleString("en-IN", { minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
      <h2 className="flex items-center gap-3 text-lg font-semibold">
        <span className="grid size-7 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white">{n}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function CheckoutForm(props: {
  token: string;
  addresses: Address[];
  zones: Zone[];
  preferredZoneId: string | null;
  lines: Line[];
  initialQuote: QuoteResult;
  dates: { value: string; label: string }[];
  slots: string[];
  methods: { id: "cod" | "sslcommerz"; label: string; description: string }[];
  currency: string;
  minOrder: number;
}) {
  const cur = props.currency;
  const def = props.addresses.find((a) => a.isDefault) ?? props.addresses[0];
  const [addressId, setAddressId] = useState<string>(def?.id ?? "new");
  const [zoneId, setZoneId] = useState<string>(def?.zoneId ?? props.preferredZoneId ?? props.zones[0]?.id ?? "");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResult>(props.initialQuote);
  const [quoting, startQuote] = useTransition();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrderAction, null);
  const e = state?.errors ?? {};

  const refresh = (z: string, c: string | null) =>
    startQuote(async () => {
      const q = await previewCheckoutAction(z || null, c);
      if (q) {
        setQuote(q);
        setAppliedCoupon(q.couponApplied ?? null);
      }
    });

  useEffect(() => {
    refresh(zoneId, appliedCoupon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId]);

  const belowMin = quote.subtotal - quote.discount < props.minOrder;

  return (
    <form action={action} onSubmit={keepValues(action)} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <input type="hidden" name="checkoutToken" value={props.token} />
      <input type="hidden" name="couponCode" value={appliedCoupon ?? ""} />
      <div className="space-y-5">
        {state?.message && <Alert tone="error">{state.message}</Alert>}

        <Section n={1} title="Delivery address">
          <div className="grid gap-3 sm:grid-cols-2">
            {props.addresses.map((a) => (
              <label key={a.id} className={cn("cursor-pointer rounded-xl border p-4 text-sm transition", addressId === a.id ? "border-brand-700 bg-mint-50 ring-1 ring-brand-700" : "border-line hover:border-brand-600")}>
                <input
                  type="radio"
                  name="addressId"
                  value={a.id}
                  checked={addressId === a.id}
                  onChange={() => {
                    setAddressId(a.id);
                    if (a.zoneId) setZoneId(a.zoneId);
                  }}
                  className="sr-only"
                />
                <span className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-brand-700" aria-hidden />{a.label}</span>
                <span className="mt-1 block">{a.fullName} · {a.phone}</span>
                <span className="block text-ink-600">{[a.line1, a.area, a.city].filter(Boolean).join(", ")}</span>
              </label>
            ))}
            <label className={cn("flex cursor-pointer items-center justify-center rounded-xl border border-dashed p-4 text-sm font-semibold", addressId === "new" ? "border-brand-700 bg-mint-50 text-brand-700" : "border-line text-ink-600 hover:border-brand-600")}>
              <input type="radio" name="addressId" value="new" checked={addressId === "new"} onChange={() => setAddressId("new")} className="sr-only" />
              + Use a new address
            </label>
          </div>
          {e.addressId && <p className="mt-2 text-sm text-tomato-600">{e.addressId}</p>}
          {addressId === "new" && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Recipient name" htmlFor="fullName" error={e.fullName}><Input id="fullName" name="fullName" required autoComplete="name" error={e.fullName} /></Field>
              <Field label="Phone" htmlFor="phone" error={e.phone}><Input id="phone" name="phone" type="tel" required autoComplete="tel" error={e.phone} /></Field>
              <Field label="House / street" htmlFor="line1" error={e.line1} className="sm:col-span-2"><Input id="line1" name="line1" required autoComplete="address-line1" error={e.line1} /></Field>
              <Field label="Landmark (optional)" htmlFor="line2" className="sm:col-span-2"><Input id="line2" name="line2" autoComplete="address-line2" /></Field>
              <Field label="Area / locality" htmlFor="area" error={e.area}><Input id="area" name="area" required error={e.area} /></Field>
              <Field label="City" htmlFor="city" error={e.city}><Input id="city" name="city" defaultValue="Karimganj" required error={e.city} /></Field>
              <Field label="Postal code (optional)" htmlFor="postalCode"><Input id="postalCode" name="postalCode" inputMode="numeric" /></Field>
              <input type="hidden" name="label" value="Home" />
              <div className="flex items-end pb-2"><Checkbox name="saveAddress" label="Save this address" defaultChecked /></div>
            </div>
          )}
        </Section>

        <Section n={2} title="Delivery area & time">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Delivery area" htmlFor="zoneId" error={e.zoneId}>
              <Select id="zoneId" name="zoneId" value={zoneId} onChange={(ev) => setZoneId(ev.target.value)} required>
                {props.zones.map((z) => (<option key={z.id} value={z.id}>{z.name}</option>))}
              </Select>
            </Field>
            <Field label="Date" htmlFor="deliveryDate" error={e.deliveryDate}>
              <Select id="deliveryDate" name="deliveryDate" defaultValue={props.dates[0]?.value}>
                {props.dates.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
              </Select>
            </Field>
            <Field label="Time slot" htmlFor="deliverySlot" error={e.deliverySlot}>
              <Select id="deliverySlot" name="deliverySlot" defaultValue={props.slots[0]}>
                {props.slots.map((s) => (<option key={s}>{s}</option>))}
              </Select>
            </Field>
          </div>
          {props.zones.find((z) => z.id === zoneId) && <p className="mt-2 text-sm text-ink-600">Estimated delivery: {props.zones.find((z) => z.id === zoneId)!.etaText}</p>}
          <Field label="Delivery notes (optional)" htmlFor="notes" className="mt-4">
            <Textarea id="notes" name="notes" maxLength={300} className="min-h-16" placeholder="Gate code, landmark, call before arriving…" />
          </Field>
        </Section>

        <Section n={3} title="Payment">
          <div className="space-y-3">
            {props.methods.map((m, i) => (
              <label key={m.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 has-[:checked]:border-brand-700 has-[:checked]:bg-mint-50">
                <input type="radio" name="paymentMethod" value={m.id} defaultChecked={i === 0} className="mt-1 accent-brand-700" />
                {m.id === "cod" ? <Banknote className="size-6 shrink-0 text-brand-700" aria-hidden /> : <CreditCard className="size-6 shrink-0 text-brand-700" aria-hidden />}
                <span>
                  <span className="block font-semibold">{m.label}</span>
                  <span className="text-sm text-ink-600">{m.description}</span>
                </span>
              </label>
            ))}
            {props.methods.length === 0 && <Alert tone="warning">No payment method is currently available. Please contact the store.</Alert>}
            {e.paymentMethod && <p className="text-sm text-tomato-600">{e.paymentMethod}</p>}
          </div>
        </Section>
      </div>

      <aside>
        <div className="sticky top-4 space-y-4 rounded-2xl border border-line bg-white p-5 shadow-card">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
            {props.lines.map((l) => (
              <li key={l.variantId} className="flex items-center gap-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.image ?? "/images/products/rice.svg"} alt="" width={44} height={44} className="size-11 rounded-lg border border-line" />
                <span className="flex-1">
                  <span className="block font-medium">{l.productName}</span>
                  <span className="text-xs text-ink-600">{l.variantName} × {l.quantity}</span>
                </span>
                <span className="tabular-nums">{fmt(l.lineTotal, cur)}</span>
              </li>
            ))}
          </ul>

          <div>
            <label htmlFor="coupon" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"><TicketPercent className="size-4 text-brand-700" aria-hidden /> Coupon code</label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-lg bg-mint-50 px-3 py-2 text-sm">
                <span><strong>{appliedCoupon}</strong> applied</span>
                <button type="button" className="font-semibold text-tomato-600" onClick={() => { setAppliedCoupon(null); setCoupon(""); refresh(zoneId, null); }}>Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input id="coupon" value={coupon} onChange={(ev) => setCoupon(ev.target.value.toUpperCase())} placeholder="e.g. FRESH20" className="uppercase" maxLength={30}
                  onKeyDown={(ev) => { if (ev.key === "Enter") { ev.preventDefault(); if (coupon) refresh(zoneId, coupon); } }} />
                <Button type="button" variant="secondary" disabled={!coupon || quoting} onClick={() => refresh(zoneId, coupon)}>Apply</Button>
              </div>
            )}
            {quote.couponError && !appliedCoupon && coupon && <p className="mt-1.5 text-sm text-tomato-600" role="alert">{quote.couponError}</p>}
          </div>

          <dl className={cn("space-y-2 border-t border-line pt-4 text-sm", quoting && "opacity-60")} aria-busy={quoting}>
            <div className="flex justify-between"><dt className="text-ink-600">Subtotal</dt><dd className="tabular-nums">{fmt(quote.subtotal, cur)}</dd></div>
            {quote.discount > 0 && <div className="flex justify-between text-brand-700"><dt>Discount</dt><dd className="tabular-nums">−{fmt(quote.discount, cur)}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink-600">Delivery</dt><dd className="tabular-nums">{quote.deliveryFee ? fmt(quote.deliveryFee, cur) : "Free"}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-bold"><dt>Total</dt><dd className="tabular-nums">{fmt(quote.total, cur)}</dd></div>
          </dl>
          {belowMin && <Alert tone="warning">Minimum order is {fmt(props.minOrder, cur)}.</Alert>}
          <Button size="lg" className="w-full" disabled={pending || quoting || belowMin || props.methods.length === 0}>
            {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Lock className="size-4" aria-hidden />}
            {pending ? "Placing order…" : `Place order · ${fmt(quote.total, cur)}`}
          </Button>
          <p className="text-center text-xs text-ink-400">Prices and stock are confirmed when you place the order.</p>
        </div>
      </aside>
    </form>
  );
}
