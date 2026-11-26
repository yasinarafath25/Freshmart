"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReviewAction, type FormState } from "@/app/actions/misc";
import { Alert, Button, Field, Input, Textarea } from "@/components/ui";
import { keepValues } from "@/lib/utils/form";

export function ReviewForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitReviewAction, null);
  const [rating, setRating] = useState(0);
  if (state?.ok) return <Alert tone="success">{state.message}</Alert>;
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4 rounded-2xl border border-line bg-canvas p-5">
      <h3 className="font-semibold">Write a review</h3>
      <input type="hidden" name="productId" value={productId} />
      <fieldset>
        <legend className="mb-1 text-sm font-medium">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="rating" value={n} className="sr-only peer" onChange={() => setRating(n)} required />
              <Star className={`size-7 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 rounded ${n <= rating ? "fill-sun-400 text-sun-400" : "text-line"}`} aria-hidden />
              <span className="sr-only">{n} star{n > 1 ? "s" : ""}</span>
            </label>
          ))}
        </div>
        {state?.errors?.rating && <p className="mt-1 text-sm text-tomato-600">{state.errors.rating}</p>}
      </fieldset>
      <Field label="Title (optional)" htmlFor="r-title">
        <Input id="r-title" name="title" maxLength={80} />
      </Field>
      <Field label="Your review" htmlFor="r-body" error={state?.errors?.body}>
        <Textarea id="r-body" name="body" required minLength={10} maxLength={1500} error={state?.errors?.body} />
      </Field>
      {state?.message && !state.ok && <Alert tone="error">{state.message}</Alert>}
      <Button disabled={pending}>{pending ? "Submitting…" : "Submit review"}</Button>
    </form>
  );
}
