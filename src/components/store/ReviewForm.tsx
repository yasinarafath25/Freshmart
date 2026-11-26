"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReviewAction, type FormState } from "@/app/actions/misc";
import { Alert, Button, Field, Input, Textarea } from "@/components/ui";
import { keepValues } from "@/lib/utils/form";
import { useI18n } from "@/lib/i18n/client";

export function ReviewForm({ productId }: { productId: string }) {
  const { d, st } = useI18n();
  const p = d.product;
  const [raw, action, pending] = useActionState<FormState, FormData>(submitReviewAction, null);
  const state = st(raw);
  const [rating, setRating] = useState(0);
  if (state?.ok) return <Alert tone="success">{state.message}</Alert>;
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4 rounded-2xl border border-line bg-canvas p-5">
      <h3 className="font-semibold">{p.writeReview}</h3>
      <input type="hidden" name="productId" value={productId} />
      <fieldset>
        <legend className="mb-1 text-sm font-medium">{p.yourRating}</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="rating" value={n} className="peer sr-only" onChange={() => setRating(n)} required />
              <Star className={`size-8 rounded peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 ${n <= rating ? "fill-sun-400 text-sun-400" : "text-line"}`} aria-hidden />
              <span className="sr-only">{p.stars(n)}</span>
            </label>
          ))}
        </div>
        {state?.errors?.rating && <p className="mt-1 text-sm text-tomato-600">{state.errors.rating}</p>}
      </fieldset>
      <Field label={p.reviewTitle} htmlFor="r-title">
        <Input id="r-title" name="title" maxLength={80} />
      </Field>
      <Field label={p.reviewBody} htmlFor="r-body" error={state?.errors?.body}>
        <Textarea id="r-body" name="body" required minLength={10} maxLength={1500} error={state?.errors?.body} />
      </Field>
      {state?.message && !state.ok && <Alert tone="error">{state.message}</Alert>}
      <Button disabled={pending}>{pending ? p.submitting : p.submitReview}</Button>
    </form>
  );
}
