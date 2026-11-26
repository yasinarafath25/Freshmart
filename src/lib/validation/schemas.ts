import { z } from "zod";

export const email = z.string().trim().toLowerCase().email("Please enter a valid email address.").max(160);
export const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.")
  .regex(/[A-Za-z]/, "Password must contain a letter.")
  .regex(/[0-9]/, "Password must contain a number.");
export const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{7,16}$/, "Please enter a valid phone number.");
export const optionalPhone = phone.optional().or(z.literal("").transform(() => undefined));

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
  email,
  phone: optionalPhone,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Please enter your password.").max(128),
  remember: z.literal("on").optional(),
});

export const addressSchema = z.object({
  label: z.string().trim().max(30).default("Home"),
  fullName: z.string().trim().min(2, "Please enter the recipient’s name.").max(80),
  phone,
  line1: z.string().trim().min(3, "Please enter house / street.").max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  area: z.string().trim().min(2, "Please enter the area / locality.").max(80),
  city: z.string().trim().min(2, "Please enter the city.").max(60),
  postalCode: z.string().trim().max(12).optional().or(z.literal("")),
  zoneId: z.string().uuid("Please choose a delivery area."),
});

export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "form");
    out[k] ??= i.message;
  }
  return out;
}
