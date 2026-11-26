import { NextResponse } from "next/server";
import { readImage } from "@/lib/services/media";

export async function GET(_: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const img = await readImage(key.join("/"));
  if (!img) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Image not found" } }, { status: 404 });
  return new Response(img.body, {
    headers: {
      "Content-Type": img.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
