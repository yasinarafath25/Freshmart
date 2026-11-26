// Local development PostgreSQL (real Postgres 17 binaries via embedded-postgres).
// Data persists in ./.data/pg. Never used in production.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";

const dir = "./.data/pg";
const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user: "postgres",
  password: "postgres",
  port: Number(process.env.DEV_DB_PORT ?? 54329),
  persistent: true,
  // UTF-8 regardless of the OS code page (Windows defaults to WIN1252, which rejects ৳).
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

if (!existsSync(dir)) {
  await pg.initialise();
}
await pg.start();
try {
  await pg.createDatabase("freshmart");
} catch {
  /* already exists */
}
console.log("Dev Postgres running: postgres://postgres:postgres@localhost:54329/freshmart");
const stop = async () => { await pg.stop(); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
