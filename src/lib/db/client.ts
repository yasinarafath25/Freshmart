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
 * - On Cloudflare Workers: a new pg Pool per request through Hyperdrive (pools must not be shared across requests).
 * - In Node (dev / next start): one shared Pool from DATABASE_URL.
 */
export const getDb = cache((): DB => {
  assertEnv();
  const hyperdrive = getCfEnv()?.HYPERDRIVE;
  if (hyperdrive) {
    const pool = new Pool({ connectionString: hyperdrive.connectionString, maxUses: 1 });
    return drizzle({ client: pool, schema });
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  g.__fmPool ??= new Pool({ connectionString: url, max: 10 });
  return drizzle({ client: g.__fmPool, schema });
});
