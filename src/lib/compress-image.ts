/**
 * Shrinks a photo in the browser before upload: longest side ≤ maxSide px, re-encoded as WebP
 * (JPEG if the browser can't encode WebP). Keeps the original when it is already small or
 * when the browser can't decode it. A 6 MB phone photo usually becomes ~150–300 KB.
 */
export async function compressImage(file: File, maxSide = 1200, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff"; // transparent PNGs get a white background
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const toBlob = (type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, quality));
    let blob = await toBlob("image/webp");
    if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg");
    if (!blob || (blob.size >= file.size && scale === 1)) return file;
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + ext, { type: blob.type });
  } catch {
    return file;
  }
}
