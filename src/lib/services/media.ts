import "server-only";
import { eq } from "drizzle-orm";
import { getCfEnv } from "@/lib/utils/cf";
import { getDb } from "@/lib/db/client";
import { media } from "@/lib/db/schema";

/**
 * Image storage, served by /media/[...key].
 * - Cloudflare R2 bucket bound as MEDIA, when present.
 * - Otherwise the `media` table in PostgreSQL — survives redeploys on hosts with no
 *   persistent disk (Render free, Workers). Photos are shrunk in the browser before upload.
 * - Older uploads saved under ./.data/uploads are still served (read-only fallback).
 */
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const KEY_RE = /^products\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/;

export function isValidKey(key: string) {
  return KEY_RE.test(key);
}

/** Checks magic bytes so a renamed file can't pass as an image. */
function sniff(buf: Uint8Array): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  const ascii = String.fromCharCode(...buf.slice(0, 12));
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return "image/webp";
  if (ascii.slice(4, 12) === "ftypavif") return "image/avif";
  return null;
}

export async function storeImage(file: File): Promise<{ url: string } | { error: string }> {
  if (file.size === 0) return { error: "Empty file." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image must be 5 MB or smaller." };
  const buf = new Uint8Array(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || !ALLOWED_IMAGE_TYPES[type]) return { error: "Only JPEG, PNG, WebP or AVIF images are allowed." };
  const key = `products/${crypto.randomUUID()}.${ALLOWED_IMAGE_TYPES[type]}`;
  const r2 = getCfEnv()?.MEDIA;
  if (r2) {
    await r2.put(key, buf.buffer as ArrayBuffer, { httpMetadata: { contentType: type } });
  } else {
    await getDb().insert(media).values({ key, contentType: type, size: buf.byteLength, data: Buffer.from(buf) });
  }
  return { url: `/media/${key}` };
}

export async function readImage(key: string): Promise<{ body: BodyInit; contentType: string } | null> {
  if (!isValidKey(key)) return null;
  const cf = getCfEnv();
  const r2 = cf?.MEDIA;
  const ext = key.split(".").pop()!;
  const contentType = Object.entries(ALLOWED_IMAGE_TYPES).find(([, e]) => e === ext)?.[0] ?? "application/octet-stream";
  if (r2) {
    const obj = await r2.get(key);
    if (obj) return { body: obj.body, contentType: obj.httpMetadata?.contentType ?? contentType };
  }
  const row = await getDb().query.media.findFirst({ where: eq(media.key, key) });
  if (row) return { body: new Uint8Array(row.data), contentType: row.contentType };
  if (cf) return null;
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const data = await fs.readFile(path.join(process.cwd(), ".data", "uploads", key));
    return { body: new Uint8Array(data), contentType };
  } catch {
    return null;
  }
}
