import "server-only";
import { z } from "zod";

/** Validates required server configuration once, on first use. Throws with a clear list of problems. */
const schema = z.object({
  APP_URL: z.string().url("APP_URL must be a full URL, e.g. https://shop.example.com"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  SSLCOMMERZ_STORE_ID: z.string().optional(),
  SSLCOMMERZ_STORE_PASSWORD: z.string().optional(),
});

let checked = false;
export function assertEnv() {
  if (checked) return;
  const res = schema.safeParse(process.env);
  if (!res.success) {
    const msg = res.error.issues.map((i) => `${String(i.path[0])}: ${i.message}`).join("; ");
    throw new Error(`Invalid server configuration — ${msg}`);
  }
  if (!!res.data.SSLCOMMERZ_STORE_ID !== !!res.data.SSLCOMMERZ_STORE_PASSWORD) {
    throw new Error("Invalid server configuration — set both SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD, or neither");
  }
  checked = true;
}
