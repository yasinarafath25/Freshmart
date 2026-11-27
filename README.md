# FreshMart — Fresh Grocery E-commerce

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM · PostgreSQL · Cloudflare Workers (OpenNext).

Project documentation lives in [`docs/`](docs): [Overview](docs/PROJECT_OVERVIEW.md) · [PRD](docs/PRD.md) · [TRD](docs/TRD.md) · [Route map](docs/ROUTE_MAP.md) · [Design system](docs/UI_UX_DESIGN_SYSTEM.md) · [Roadmap](docs/DEVELOPMENT_ROADMAP.md).

---

## 1. Local development

Requirements: Node.js 20.9+ (tested on 25), npm. No Docker or Postgres install needed — a real PostgreSQL 17 runs from `node_modules` via `embedded-postgres`.

```bash
npm install
cp .env.example .env.local          # then fill in SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
npm run db:start                    # terminal 1 — keeps Postgres running on port 54329 (data in ./.data/pg)
npm run db:migrate                  # terminal 2
npm run db:seed                     # roles, settings, delivery areas, categories, starter catalog, first admin
npm run dev                         # http://localhost:3000  ·  admin: http://localhost:3000/admin
```

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server / production build / production server (Node) |
| `npm run lint` / `typecheck` / `test` | ESLint · `tsc --noEmit` · Vitest unit tests |
| `npm run smoke` | Hits every route against a running server (`BASE_URL` env, default localhost:3000) |
| `npm run db:generate` / `db:migrate` | Create a migration from `src/lib/db/schema.ts` / apply migrations |
| `npm run db:seed` | Idempotent seed (safe to re-run; never overwrites existing products) |
| `npm run admin:create` | Create a Super Admin or reset an admin password. Asks for email and password (hidden) — works in PowerShell, CMD and Bash; also clears a sign-in lockout and verifies the password |
| `npm run art` | Regenerates the placeholder SVG product illustrations |
| `npm run preview` / `deploy` | OpenNext build + local Workers preview / deploy to Cloudflare |

## 2. Before launch — owner checklist

- [ ] **Currency & market:** Admin → Settings. Default is `৳` / `BDT` (from the design). If the store operates in India (Karimganj, Assam) switch to `₹` / `INR` — and note SSLCommerz is a Bangladeshi gateway; an Indian gateway (e.g. Razorpay) would need to be added via `src/lib/services/payments.ts`.
- [ ] **Catalog:** seeded prices are placeholders — review every price. Product, category and hero photos come from `website-images/` (copied to `public/images/photos/`); 55 products use them.
- [ ] **Photo licences:** `website-images/image-list.md` credits a photographer/studio per photo, shown on `/about#photo-credits`. Confirm each photo's licence allows commercial use and whether that credit is sufficient. After changing photos, run `npm run photos` (syncs `public/images/photos/` and regenerates the credits).
- [ ] **Store details:** phone, email, address, announcements, delivery slots (Admin → Settings); delivery areas & fees (Admin → Delivery).
- [ ] **Bangla text:** review the Bangla product names/descriptions (Admin → Products) and policy pages with a native speaker.
- [ ] **Policies:** `/terms`, `/privacy-policy`, `/refund-policy` contain starter text — have them reviewed.
- [ ] **Coupons:** three starter coupons (FRESH20, WELCOME50, FREEDEL) exist — edit or delete in Admin → Coupons.

## 3. Production deployment (Cloudflare Workers)

> **Windows note:** `opennextjs-cloudflare build` needs permission to create symlinks. On Windows run it from **WSL**, or enable Windows *Developer Mode*. (`next build` itself works natively.) CI on Linux has no such issue.

### 3.1 One-time setup

1. **Database** — create a PostgreSQL 15+ database (Neon recommended; Supabase/RDS also fine). Note its connection string.
2. **Run migrations & seed against it** (from your machine/CI):
   ```bash
   DATABASE_URL="postgres://…" npx drizzle-kit migrate
   DATABASE_URL="postgres://…" npx tsx scripts/seed.ts
   DATABASE_URL="postgres://…" npx tsx scripts/create-admin.ts      # asks for email + password
   ```
   (For a production catalog, you may skip the starter products by deleting them afterwards in the admin.)
3. **Hyperdrive** (connection pooling for Workers):
   ```bash
   npx wrangler hyperdrive create freshmart-db --connection-string="postgres://…"
   ```
   Put the returned id into `wrangler.jsonc` → `hyperdrive[0].id`.
4. **R2 bucket** for product photos:
   ```bash
   npx wrangler r2 bucket create freshmart-media
   ```
5. **Config & secrets** — set `APP_URL` in `wrangler.jsonc` `vars`, then:
   ```bash
   npx wrangler secret put RESEND_API_KEY            # optional, for password-reset emails
   npx wrangler secret put EMAIL_FROM                # e.g. "FreshMart <orders@yourdomain>"
   npx wrangler secret put SSLCOMMERZ_STORE_ID       # optional, enables online payment
   npx wrangler secret put SSLCOMMERZ_STORE_PASSWORD
   npx wrangler secret put TELEGRAM_BOT_TOKEN        # optional, order alerts on Telegram
   npx wrangler secret put TELEGRAM_CHAT_ID
   ```
   Keep `SSLCOMMERZ_SANDBOX = "true"` until you have completed sandbox test payments.

### 3.2 Build & deploy

```bash
npm ci
npm run lint && npm run typecheck && npm test
npm run deploy          # opennextjs-cloudflare build && opennextjs-cloudflare deploy
```
Then attach your domain to the Worker (Cloudflare dashboard → Workers → freshmart → Domains).

### 3.3 Environment variable checklist

| Variable | Where | Required |
|---|---|---|
| `APP_URL` | wrangler `vars` | **yes** — validated at startup |
| `HYPERDRIVE` binding | wrangler `hyperdrive` | **yes** (production DB) |
| `MEDIA` binding | wrangler `r2_buckets` | **yes** (image uploads) |
| `DATABASE_URL` | local `.env.local` / CI only | for migrations & scripts |
| `RESEND_API_KEY`, `EMAIL_FROM` | secret | optional (without it reset emails are only logged) |
| `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_SANDBOX` | secret / var | optional (set both IDs or neither) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | secret | optional — Telegram alert for every new order / customer cancellation. Setup steps and a test button: Admin → Settings |

### 3.4 Database migrations (later releases)

```bash
npm run db:generate               # after editing src/lib/db/schema.ts — commit the new drizzle/*.sql
DATABASE_URL="postgres://…" npm run db:migrate   # run BEFORE deploying code that needs it
```

### 3.5 Recommended Cloudflare settings

- WAF rate-limiting rules for `POST /login`, `/register`, `/checkout` (the app also rate-limits in the DB).
- Always Use HTTPS, HSTS (the app sends an HSTS header in production).
- Optional: Image Resizing on the zone for automatic WebP/AVIF.

### 3.6 Post-deployment verification

- [ ] `GET /api/health` → `{"data":{"status":"ok","db":"ok"}}`
- [ ] `BASE_URL=https://yourdomain npm run smoke` passes
- [ ] Register a customer, add items, apply a coupon, place a COD order
- [ ] In `/admin`, move the order through to *Delivered* and *Mark cash collected*
- [ ] Upload a product photo (verifies the R2 binding)
- [ ] Request a password reset (verifies email, if configured)
- [ ] If online payment is enabled: complete a sandbox payment and confirm the order shows **Paid**
- [ ] `/sitemap.xml` and `/robots.txt` show your real domain

## 4. Project status (2026-11-27)

**Done and tested locally:** all six docs; storefront (home, listings with filters/sort/pagination, search, product details with variants, offers, organic, content pages); cart (guest + merge on login); auth (register, login, logout, password reset, rate-limited); customer account (overview, notifications, orders + cancel, addresses, wishlist, profile/password); checkout with server-side pricing, coupons, delivery areas/slots, idempotent order placement with atomic stock decrement; COD payment flow; full admin (dashboard, orders workflow, products with variants & image upload, categories, inventory movements, customers, messages, reviews moderation, coupons, delivery, payments ledger, reports + CSV, settings, staff users, roles/permissions, audit log); SEO (metadata, sitemap, robots, JSON-LD); security headers; unit tests; route smoke test.

**Bangla / English:** the whole storefront, account, checkout and policy pages are bilingual with a language switch; products, categories, delivery areas and announcements have Bangla text (admin forms include Bangla fields). Admin panel stays English. See TRD §15a.

**Usability additions:** mobile bottom navigation, add-to-cart toasts, live search suggestions, filter chips, sticky checkout bars, copyable coupon codes, optional call/WhatsApp help button (set a support phone in Settings).

**Product photos:** the seed maps 55 products to the owner's photos and only replaces seed placeholder art, never images an admin uploaded. Re-run `npm run db:seed` on any database to apply.

**Not verified / pending:**
- OpenNext Workers build not run successfully on this Windows machine (symlink permission) — run in WSL/CI.
- SSLCommerz integration is written against the public API but **untested** (no sandbox credentials).
- Email sending (Resend) untested without an API key.
- No audit-log viewer screen yet (rows are written to `audit_logs`).
- Image optimisation relies on uploading web-sized images (no automatic resizing).
