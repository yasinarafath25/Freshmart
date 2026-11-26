import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { isValidTimeZone } from "@/lib/utils/dates";

export const storeSettingsSchema = z.object({
  storeName: z.string().min(1).max(60).default("FreshMart"),
  tagline: z.string().max(80).default("Eat Fresh, Live Healthy"),
  currencySymbol: z.string().min(1).max(4).default("৳"),
  currencyCode: z.string().length(3).default("BDT"),
  supportPhone: z.string().max(30).default(""),
  supportEmail: z.string().max(120).default(""),
  address: z.string().max(200).default(""),
  defaultLocation: z.string().max(60).default("Karimganj"),
  timeZone: z.string().max(60).refine(isValidTimeZone, "Unknown time zone").default("Asia/Kolkata"),
  minOrder: z.number().int().min(0).default(10000), // minor units
  freeDeliveryThreshold: z.number().int().min(0).default(99900),
  lowStockThreshold: z.number().int().min(0).default(10),
  deliverySlots: z.array(z.string().min(1).max(40)).default(["8:00 AM – 11:00 AM", "12:00 PM – 3:00 PM", "5:00 PM – 8:00 PM"]),
  codEnabled: z.boolean().default(true),
  announcements: z
    .array(z.string().max(80))
    .default(["Free Home Delivery on orders ৳999+", "100% Fresh Guarantee", "24/7 Customer Support"]),
  socialFacebook: z.string().max(200).default(""),
  socialInstagram: z.string().max(200).default(""),
});
export type StoreSettings = z.infer<typeof storeSettingsSchema>;

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const db = getDb();
  const row = await db.query.settings.findFirst({ where: eq(settings.key, "store") });
  const parsed = storeSettingsSchema.safeParse(row?.value ?? {});
  return parsed.success ? parsed.data : storeSettingsSchema.parse({});
});

export async function saveSettings(value: StoreSettings) {
  const db = getDb();
  await db
    .insert(settings)
    .values({ key: "store", value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}
