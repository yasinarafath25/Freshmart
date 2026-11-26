import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return NextResponse.json({ data: { status: "ok", db: "ok", time: new Date().toISOString() } });
  } catch {
    return NextResponse.json({ error: { code: "DB_UNAVAILABLE", message: "Database unreachable" } }, { status: 503 });
  }
}
