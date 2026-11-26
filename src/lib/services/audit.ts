import "server-only";
import { getDb } from "@/lib/db/client";
import { auditLogs } from "@/lib/db/schema";

export async function audit(actorId: string, action: string, entity: string, entityId: string | null, data?: unknown) {
  try {
    await getDb().insert(auditLogs).values({ actorId, action, entity, entityId, data: data ?? null });
  } catch (e) {
    console.error("[audit] failed to write", e);
  }
}
