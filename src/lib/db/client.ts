import "server-only";
import { cache } from "react";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { getCfEnv } from "@/lib/utils/cf";
import { assertEnv } from "@/lib/env";

export type DB = NodePgDatabase<typeof schema>;

const g = globalThis as unknown as { __fmPool?: Pool };

/**
 * Returns a Drizzle client.
 * - Cloudflare Workers + Hyperdrive binding: new Pool per request via Hyperdrive (recommended for production).
 * - Cloudflare Workers without Hyperdrive: new Pool per request straight to DATABASE_URL (simplest first deploy).
 *   Workers must not share connections between requests, so no global pool there.
 * - Node (dev / next start): one shared Pool from DATABASE_URL.
 */
export const getDb = cache((): DB => {
  assertEnv();
  const cf = getCfEnv();
  if (cf?.HYPERDRIVE) {
    const pool = new Pool({ connectionString: cf.HYPERDRIVE.connectionString, maxUses: 1 });
    return drizzle({ client: pool, schema });
  }
  const url = process.env.DATABASE_URL ?? (cf as { DATABASE_URL?: string } | undefined)?.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (cf) {
    const pool = new Pool({ connectionString: url, max: 1, maxUses: 1 });
    return drizzle({ client: pool, schema });
  }
  g.__fmPool ??= new Pool({ connectionString: url, max: 10 });
  return drizzle({ client: g.__fmPool, schema });
});
