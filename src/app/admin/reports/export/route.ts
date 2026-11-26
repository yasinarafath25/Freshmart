import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { salesByDay } from "@/lib/services/reports";
import { parseRange } from "@/lib/utils/range";
import { getSettings } from "@/lib/services/settings";

export const dynamic = "force-dynamic";

/** CSV export of daily sales. Staff with reports:read only. */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "staff" || !hasPermission(user.permissions, "reports:read")) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Not allowed" } }, { status: 403 });
  }
  const settings = await getSettings();
  const r = parseRange({ from: req.nextUrl.searchParams.get("from") ?? undefined, to: req.nextUrl.searchParams.get("to") ?? undefined }, settings.timeZone);
  const rows = await salesByDay(r);
  const csv = ["date,orders,revenue", ...rows.map((d) => `${d.day},${d.orders},${(d.revenue / 100).toFixed(2)}`)].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sales_${r.fromStr}_${r.toStr}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
