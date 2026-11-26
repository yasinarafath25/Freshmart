import "server-only";
import { getCfEnv } from "@/lib/utils/cf";

/**
 * Image storage. Production: Cloudflare R2 bucket bound as MEDIA.
 * Development (plain Node): files under ./.data/uploads. Served by /media/[...key].
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
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const full = path.join(process.cwd(), ".data", "uploads", key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, buf);
  }
  return { url: `/media/${key}` };
}

export async function readImage(key: string): Promise<{ body: BodyInit; contentType: string } | null> {
  if (!isValidKey(key)) return null;
  const r2 = getCfEnv()?.MEDIA;
  const ext = key.split(".").pop()!;
  const contentType = Object.entries(ALLOWED_IMAGE_TYPES).find(([, e]) => e === ext)?.[0] ?? "application/octet-stream";
  if (r2) {
    const obj = await r2.get(key);
    if (!obj) return null;
    return { body: obj.body, contentType: obj.httpMetadata?.contentType ?? contentType };
  }
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const data = await fs.readFile(path.join(process.cwd(), ".data", "uploads", key));
    return { body: new Uint8Array(data), contentType };
  } catch {
    return null;
  }
}
