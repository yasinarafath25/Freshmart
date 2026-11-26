import { fromBase64Url, timingSafeEqual, toBase64Url } from "@/lib/utils/crypto";

// PBKDF2-SHA256. 100k iterations is the maximum Cloudflare Workers allow.
const ITERATIONS = 100_000;
const enc = new TextEncoder();

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, iter, salt, hash] = stored.split("$");
  if (algo !== "pbkdf2" || !iter || !salt || !hash) return false;
  const n = Number(iter);
  if (!Number.isInteger(n) || n < 1 || n > ITERATIONS) return false;
  const derived = await derive(password, fromBase64Url(salt), n);
  return timingSafeEqual(derived, fromBase64Url(hash));
}
