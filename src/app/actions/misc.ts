"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { contactMessages, newsletterSubscribers, products, reviews } from "@/lib/db/schema";
import { clientIp, rateLimit } from "@/lib/utils/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";
import { canReview } from "@/lib/services/reviews";

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string> } | null;

function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "form");
    out[k] ??= i.message;
  }
  return out;
}

export async function subscribeNewsletterAction(_: FormState, formData: FormData): Promise<FormState> {
  const email = z.string().trim().toLowerCase().email("Please enter a valid email.").max(160).safeParse(formData.get("email"));
  if (!email.success) return { ok: false, message: email.error.issues[0].message };
  if (!(await rateLimit(`news:${await clientIp()}`, 5, 3600))) return { ok: false, message: "Too many attempts. Please try later." };
  await getDb().insert(newsletterSubscribers).values({ email: email.data }).onConflictDoNothing();
  return { ok: true, message: "Thanks for subscribing! Watch your inbox for fresh deals." };
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.string().trim().toLowerCase().email("Please enter a valid email.").max(160),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  subject: z.string().trim().min(3, "Please add a subject.").max(120),
  message: z.string().trim().min(10, "Message should be at least 10 characters.").max(2000),
});

export async function sendContactMessageAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  if (!(await rateLimit(`contact:${await clientIp()}`, 5, 3600))) return { ok: false, message: "Too many messages. Please try again later." };
  await getDb().insert(contactMessages).values({ ...parsed.data, phone: parsed.data.phone || null });
  return { ok: true, message: "Message sent! Our team will reply within one business day." };
}

const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "Please choose a rating.").max(5),
  title: z.string().trim().max(80).optional(),
  body: z.string().trim().min(10, "Please write at least 10 characters.").max(1500),
});

export async function submitReviewAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in to write a review." };
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { eligible } = await canReview(user.id, parsed.data.productId);
  if (!eligible) return { ok: false, message: "Only customers who received this product can review it (once)." };
  await getDb().insert(reviews).values({ ...parsed.data, title: parsed.data.title || null, userId: user.id });
  const p = await getDb().query.products.findFirst({ where: eq(products.id, parsed.data.productId) });
  if (p) revalidatePath(`/product/${p.slug}`);
  return { ok: true, message: "Thank you! Your review will appear after moderation." };
}
