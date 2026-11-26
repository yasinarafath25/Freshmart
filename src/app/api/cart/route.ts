import { NextResponse } from "next/server";
import { getCart } from "@/lib/services/cart";

export const dynamic = "force-dynamic";

export async function GET() {
  const { lines } = await getCart();
  const available = lines.filter((l) => l.available);
  return NextResponse.json(
    {
      data: {
        count: lines.reduce((s, l) => s + l.quantity, 0),
        subtotal: available.reduce((s, l) => s + l.lineTotal, 0),
        lines: lines.map(({ variantId, productName, variantName, quantity, unitPrice, available }) => ({ variantId, productName, variantName, quantity, unitPrice, available })),
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
