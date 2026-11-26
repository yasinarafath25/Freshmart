import { NextResponse, type NextRequest } from "next/server";
import { markSslcommerzAttempt, validateSslcommerz } from "@/lib/services/payments";
import { getDb } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// SSLCommerz posts application/x-www-form-urlencoded data to these endpoints.
// Nothing posted by the browser is trusted: success/IPN are confirmed with the validation API.
export async function POST(req: NextRequest, { params }: { params: Promise<{ event: string }> }) {
  const { event } = await params;
  const appUrl = process.env.APP_URL ?? new URL(req.url).origin;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Expected form data" } }, { status: 400 });
  }
  const valId = String(form.get("val_id") ?? "").slice(0, 100);
  const tranId = String(form.get("tran_id") ?? "").slice(0, 100);

  if (event === "success" || event === "ipn") {
    const res = valId ? await validateSslcommerz(valId) : { ok: false as const, reason: "missing-val-id" };
    if (event === "ipn") return NextResponse.json({ received: true, ok: res.ok });
    if (res.ok) return NextResponse.redirect(`${appUrl}/checkout/success/${res.order.orderNumber}`, 303);
    console.warn("[sslcommerz] success callback failed validation", res.reason);
    return redirectToOrder(appUrl, res.orderId ?? null, tranId);
  }
  if (event === "fail" || event === "cancel") {
    const orderId = tranId ? await markSslcommerzAttempt(tranId, event === "fail" ? "failed" : "cancelled") : null;
    return redirectToOrder(appUrl, orderId, tranId);
  }
  return NextResponse.json({ error: { code: "NOT_FOUND", message: "Unknown event" } }, { status: 404 });
}

async function redirectToOrder(appUrl: string, orderId: string | null, tranId: string) {
  if (!orderId && tranId) {
    const num = tranId.split("-").slice(0, 3).join("-");
    const o = await getDb().query.orders.findFirst({ where: eq(orders.orderNumber, num) });
    orderId = o?.id ?? null;
  }
  return NextResponse.redirect(orderId ? `${appUrl}/account/orders/${orderId}?payment=failed` : `${appUrl}/account/orders`, 303);
}
