/**
 * Create a Super Admin, or reset an existing account's password and make it Super Admin.
 *
 * Interactive (recommended — works the same in PowerShell, CMD and Bash; the password is hidden):
 *   npm run admin:create
 *
 * Non-interactive (CI): set ADMIN_EMAIL, ADMIN_PASSWORD and optionally ADMIN_NAME.
 *   PowerShell: use single quotes around the password ($ inside double quotes is a variable!)
 *
 * It also clears the sign-in lockout for that email, then verifies the password against the stored hash.
 */
import { createInterface } from "node:readline";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, like } from "drizzle-orm";
import { Pool } from "pg";
import * as s from "../src/lib/db/schema";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";

// One shared reader for all questions (separate readers would lose piped/pasted input).
let rl: ReturnType<typeof createInterface> | null = null;
let masking = false;
let currentQuestion = "";
const lines: string[] = [];
const waiters: ((line: string) => void)[] = [];

function reader() {
  if (rl) return rl;
  const isTty = !!process.stdin.isTTY;
  rl = createInterface({ input: process.stdin, output: isTty ? process.stdout : undefined, terminal: isTty });
  const r = rl as unknown as { _writeToOutput?: (s: string) => void; output?: NodeJS.WriteStream };
  if (isTty && r.output) {
    const out = r.output;
    // Show the question normally, but print * for each typed character while masking.
    r._writeToOutput = (str: string) => {
      if (!masking || str.includes(currentQuestion)) out.write(str);
      else if (/^[\r\n]+$/.test(str)) out.write("\n");
      else out.write("*".repeat(str.length));
    };
  }
  rl.on("line", (line) => {
    const w = waiters.shift();
    if (w) w(line);
    else lines.push(line);
  });
  return rl;
}

function ask(question: string, hidden = false): Promise<string> {
  const r = reader();
  currentQuestion = question;
  masking = hidden;
  if (process.stdin.isTTY) {
    r.setPrompt(question);
    r.prompt();
  } else {
    process.stdout.write(question + (hidden ? "(hidden)\n" : "\n"));
  }
  return new Promise((resolve) => {
    const done = (line: string) => {
      masking = false;
      resolve(line.replace(/[\r\n]+$/, ""));
    };
    const queued = lines.shift();
    if (queued !== undefined) done(queued);
    else waiters.push(done);
  });
}

async function main() {
  const interactive = !process.env.ADMIN_PASSWORD;
  let email = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  let name = process.env.ADMIN_NAME?.trim() ?? "";
  let password = process.env.ADMIN_PASSWORD ?? "";

  if (interactive) {
    console.log("Create / reset a FreshMart Super Admin\n");
    if (!email) email = (await ask("Email: ")).trim().toLowerCase();
    if (!name) name = (await ask("Name (Enter for 'Store Admin'): ")).trim();
    password = await ask("Password (min 10 characters): ", true);
    const again = await ask("Repeat password: ", true);
    rl?.close();
    if (password !== again) {
      console.error("\n✗ Passwords do not match. Nothing was changed.");
      process.exit(1);
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("✗ Please enter a valid email address.");
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("✗ Password must be at least 10 characters. Nothing was changed.");
    process.exit(1);
  }
  if (password !== password.trim()) console.warn("! Note: your password starts or ends with a space — you must type it exactly the same way when signing in.");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema: s });
  try {
    const role = await db.query.roles.findFirst({ where: eq(s.roles.name, "Super Admin") });
    if (!role) {
      console.error("✗ Roles are missing. Run `npm run db:seed` first.");
      process.exit(1);
    }
    const hash = await hashPassword(password);
    const existing = await db.query.users.findFirst({ where: eq(s.users.email, email) });
    let userId: string;
    if (existing) {
      await db.update(s.users).set({ role: "staff", staffRoleId: role.id, passwordHash: hash, status: "active", ...(name ? { name } : {}) }).where(eq(s.users.id, existing.id));
      await db.delete(s.sessions).where(eq(s.sessions.userId, existing.id)); // sign out old sessions
      userId = existing.id;
      console.log(`✓ Updated ${email}: password reset, role Super Admin, account active.`);
    } else {
      const [u] = await db.insert(s.users).values({ name: name || "Store Admin", email, passwordHash: hash, role: "staff", staffRoleId: role.id }).returning({ id: s.users.id });
      userId = u.id;
      console.log(`✓ Created Super Admin ${email}.`);
    }

    // Lift any sign-in lockout for this email (rate limit keys are "login:<ip>:<email>").
    const cleared = await db.delete(s.rateLimits).where(like(s.rateLimits.key, `login:%:${email}`)).returning({ key: s.rateLimits.key });
    if (cleared.length) console.log("✓ Sign-in lockout cleared for this email.");

    // Prove the stored password matches what was entered.
    const row = await db.query.users.findFirst({ where: eq(s.users.id, userId) });
    if (!row || !(await verifyPassword(password, row.passwordHash))) {
      console.error("✗ Verification failed — please run the command again.");
      process.exit(1);
    }
    console.log(`✓ Password verified. Sign in at ${process.env.APP_URL ?? "http://localhost:3000"}/admin/login`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error && "code" in e && e.code === "ECONNREFUSED" ? "✗ Cannot reach the database. Start it first with `npm run db:start`." : e);
  process.exit(1);
});
