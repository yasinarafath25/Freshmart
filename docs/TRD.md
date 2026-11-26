# FreshMart — Technical Requirements Document (TRD)

Version 1.0 · Last verified against package registry: 2026-11-26

---

## 1. Technology stack (pinned & compatibility-checked)

| Layer | Choice | Version | Why |
|---|---|---|---|
| Framework | Next.js App Router | 16.4.x | Server Components, Server Actions, streaming |
| UI | React | 19.x | Required by Next 16 |
| Language | TypeScript (strict) | 5.x | Type safety |
| Styling | Tailwind CSS (CSS-first `@theme`) | 4.x | Design tokens in CSS |
| Icons | lucide-react | 1.x | Consistent stroke icon set |
| Validation | zod | 4.x | Shared server-side schemas |
| ORM | Drizzle ORM + drizzle-kit | 0.45 / 0.31 | Small bundle, edge-compatible, SQL-first migrations |
| DB driver | node-postgres `pg` | 8.2x | Officially supported on Workers through Hyperdrive |
| Database | PostgreSQL | 17 | Relational integrity, transactions |
| Deploy adapter | `@opennextjs/cloudflare` | 1.20.x | Runs Next.js on Cloudflare Workers |
| CLI | wrangler | 4.x | Workers/R2/Hyperdrive management |
| Local DB | `embedded-postgres` (dev only) | 17.x | Real Postgres without Docker/installers |

### 1.1 Compatibility verification (done before implementation)

- `@opennextjs/cloudflare@1.20.19` declares peer `next >=15.5.29 <16 || >=16.4.5` and `wrangler ^4.148.0` → Next 16.4.6 + wrangler 4.168 are supported.
- Workers run with `compatibility_flags = ["nodejs_compat"]` (required by OpenNext and `pg`).
- `pg` ≥ 8.13 is supported on Workers via Hyperdrive. A new `Pool` must be created **per request** (`maxUses: 1`), never shared across requests — implemented with React `cache()`.
- **Not used on purpose:** native modules (`bcrypt`, `sharp`, `argon2`) — they don't run on Workers. Password hashing uses Web Crypto PBKDF2 (available in Node and Workers; Workers cap PBKDF2 at 100,000 iterations, which we use).
- **No `middleware.ts`/`proxy.ts`:** Next 16 runs `proxy.ts` on the Node runtime, which OpenNext Cloudflare does not yet support. Auth is enforced in layouts, pages and server actions instead (more robust anyway).
- **Prisma not chosen:** Prisma on Workers needs driver adapters and a larger bundle; Drizzle's pg-core schema works unchanged with `pg` in Node and on Workers, keeping the Worker well under the 10 MB (paid) limit.
- `embedded-postgres` is a devDependency only and never imported by application code.
- OpenNext's build is officially supported on macOS/Linux; on Windows use WSL for `npm run preview/deploy` (dev and `next build` work natively).

## 2. System architecture

```
Browser ──HTTPS──► Cloudflare edge (WAF, rate-limit rules, CDN cache for /_next/static, /images)
                        │
                        ▼
              Cloudflare Worker (OpenNext: Next.js server)
              ├─ React Server Components / Server Actions
              ├─ Route handlers (/api/*, /media/*, /sitemap.xml)
              ├─ Bindings: HYPERDRIVE (Postgres), MEDIA (R2), ASSETS
                        │                          │
                        ▼                          ▼
             Hyperdrive pool ──► PostgreSQL     R2 bucket (product images)
             (Neon / Supabase / RDS)
External HTTPS APIs: SSLCommerz (payments, optional), Resend (email, optional)
```

## 3. Frontend architecture

```
src/
  app/
    (store)/          storefront route group: header/footer layout
    (auth)/           login / register / forgot / reset (minimal layout)
    account/          customer area (auth-guarded layout)
    admin/            staff area (RBAC-guarded layout) + admin/login
    api/              REST route handlers (payments callbacks, health, cart count)
    media/[...key]/   image proxy (R2 in prod, local disk in dev)
  components/
    ui/               primitives: Button, Input, Select, Badge, Card, Skeleton, EmptyState…
    store/            Header, Footer, ProductCard, CategoryRail, Hero, CartView…
    admin/            AdminShell, DataTable, StatCard, forms…
  lib/
    db/               schema.ts, client.ts (per-request), seed
    auth/             password.ts, session.ts, guards.ts, permissions.ts
    services/         catalog, cart, pricing, orders, coupons, payments, inventory, reports
    validation/       zod schemas
    utils/            money, slug, dates, rate-limit, env
```

- Server Components fetch data directly through `lib/services/*`. Client Components only for interactivity (variant picker, quantity steppers, mobile menu, carousel).
- Mutations use **Server Actions** (built-in Origin check → CSRF protection) with `useActionState` for field errors.
- Forms progressively enhance (work without JS where practical).

## 4. Backend architecture

- **Service layer** (`lib/services`) holds all business logic; actions/route handlers are thin: authenticate → authorize → validate (zod) → call service → revalidate/redirect.
- **Pricing engine** (`lib/services/pricing.ts`) is the single place that computes subtotal, discount, delivery fee and total. Used by cart, checkout preview and order placement.
- **Order placement** runs in one DB transaction: lock & decrement stock with conditional updates, insert order + items + history + inventory movements + payment, redeem coupon, clear cart. Idempotent through a unique `checkout_token`.
- **Audit log** for every admin write.

## 5. Database architecture

PostgreSQL schema (Drizzle, `src/lib/db/schema.ts`). Money = `integer` minor units. IDs = `uuid` (`gen_random_uuid()`), except join tables.

| Table | Key columns |
|---|---|
| `users` | id, name, email (unique, lower-case), phone, password_hash, role (`customer`/`staff`), staff_role_id → roles, status (`active`/`blocked`), created_at |
| `roles` | id, name (unique), description, permissions `text[]` |
| `sessions` | id (= SHA-256 of token), user_id, expires_at, user_agent, ip |
| `password_reset_tokens` | id (hash), user_id, expires_at, used_at |
| `addresses` | id, user_id, label, full_name, phone, line1, line2, area, city, postal_code, zone_id, is_default |
| `categories` | id, name, slug (unique), description, image, parent_id, sort_order, is_active |
| `products` | id, name, slug (unique), description, category_id, unit, images `text[]`, origin, freshness_label, is_organic, is_featured, is_seasonal, is_active, rating_avg, rating_count, sold_count, timestamps |
| `product_variants` | id, product_id, name, sku (unique), price, compare_at_price, stock, is_default, sort_order |
| `inventory_movements` | id, variant_id, change, reason (`order`/`cancel`/`restock`/`adjustment`), reference, actor_id, created_at |
| `carts` / `cart_items` | cart id (cookie), user_id; (cart_id, variant_id) PK, quantity |
| `wishlist_items` | (user_id, product_id) PK |
| `coupons` | id, code (unique), type (`percent`/`fixed`/`free_delivery`), value, min_order, max_discount, starts_at, ends_at, usage_limit, used_count, per_user_limit, is_active |
| `coupon_redemptions` | coupon_id, user_id, order_id |
| `delivery_zones` | id, name, fee, free_above, eta_text, is_active, sort_order |
| `orders` | id, order_number (unique), checkout_token (unique), user_id, status, payment_method, payment_status, subtotal, discount, delivery_fee, total, coupon_code, ship_* snapshot, zone_id, delivery_date, delivery_slot, notes, timestamps |
| `order_items` | id, order_id, product_id, variant_id, product_name, variant_name, image, unit_price, quantity, line_total |
| `order_status_history` | id, order_id, status, note, actor_id, created_at |
| `payments` | id, order_id, provider, amount, currency, status, transaction_id, validation_id, raw `jsonb`, timestamps |
| `reviews` | id, product_id, user_id, rating, title, body, status (`pending`/`approved`/`rejected`), unique(product_id,user_id) |
| `notifications` | id, user_id, title, body, link, read_at |
| `newsletter_subscribers` | email (PK), created_at |
| `contact_messages` | id, name, email, phone, subject, message, is_handled |
| `settings` | key (PK), value `jsonb` |
| `rate_limits` | key (PK), count, reset_at |
| `audit_logs` | id, actor_id, action, entity, entity_id, data `jsonb`, created_at |

Indexes: products(category_id, is_active), products(slug), trigram-free `ILIKE` search at launch (P1: `pg_trgm` GIN index), orders(user_id, created_at), orders(status), variants(product_id), sessions(user_id), inventory_movements(variant_id, created_at).

Migrations: `drizzle-kit generate` → SQL files in `drizzle/` committed to git → `drizzle-kit migrate` in CI/deploy.

## 6. API architecture

Server Actions cover storefront and admin mutations. REST route handlers exist where an external caller or non-React client needs them:

| Method & path | Purpose | Auth |
|---|---|---|
| `GET /api/health` | Liveness + DB check | Public |
| `GET /api/products?q=&category=&page=` | Product search JSON (future mobile app) | Public |
| `GET /api/cart` | Cart summary JSON (header badge refresh) | Cart cookie |
| `POST /api/payments/sslcommerz/{success,fail,cancel,ipn}` | Gateway callbacks; server validation | Gateway (validated) |
| `GET /media/[...key]` | Image delivery from R2 / local disk | Public, immutable cache |
| `GET /sitemap.xml`, `/robots.txt` | SEO | Public |

Responses: JSON `{ data }` or `{ error: { code, message } }` with correct HTTP status.

## 7. Authentication & authorization

- Passwords: PBKDF2-SHA256, 100,000 iterations, 16-byte random salt, stored as `pbkdf2$100000$salt$hash`; constant-time comparison.
- Sessions (no signing secret needed): 32-byte random token in cookie `fm_session` (`HttpOnly`, `Secure` in prod, `SameSite=Lax`, `Path=/`); DB stores only its SHA-256 hash; sliding renewal when < half lifetime remains; logout deletes the row; password change/reset deletes all of the user's sessions.
- Guards: `requireUser()`, `requireStaff(permission)` used in layouts **and** each server action (layouts alone are not a security boundary).
- RBAC: permissions are strings on roles; `*` = all. Checked server-side via `hasPermission(user, perm)`.

## 8. Data validation

All inputs validated with zod on the server (actions and route handlers): lengths, formats, enums, positive integers, UUIDs. Client-side HTML attributes (`required`, `min`, `pattern`) are convenience only.

## 9. Error handling

- Expected errors (validation, stock, coupon) → returned as typed action state and shown inline.
- Unexpected errors → logged server-side with request context; user sees `error.tsx` boundary with retry; `not-found.tsx` for 404s.
- No stack traces or SQL in responses.

## 10. Caching strategy

- Static assets (`/_next/static`, `/images`) — immutable, CDN-cached.
- `/media/*` — `Cache-Control: public, max-age=31536000, immutable` (keys are content-unique).
- Pages are rendered dynamically per request at launch (cart badge, session and stock must be fresh). P1: enable OpenNext R2 incremental cache and tag-based revalidation for catalog pages.
- No user-specific data is ever cached publicly.

## 11. Image optimisation

- Uploads: JPEG/PNG/WebP/AVIF/SVG(admin only), ≤ 5 MB, stored in R2 under `products/{uuid}.{ext}`.
- Rendered with explicit `width`/`height`, `loading="lazy"` (eager + `fetchpriority=high` for LCP image), `decoding="async"`.
- Recommendation: enable Cloudflare Image Resizing / Images on the zone for automatic WebP/AVIF (P1).
- Seed images are SVG placeholder illustrations — replace with real photography before launch.

## 12. Security architecture

| Threat | Mitigation |
|---|---|
| SQL injection | Drizzle parameterised queries only; no string-built SQL with user input |
| XSS | React escaping; no `dangerouslySetInnerHTML` except JSON-LD (serialised + `<` escaped); CSP header |
| CSRF | Server Actions Origin check; `SameSite=Lax` cookies; payment callbacks verified server-to-server |
| Broken access control | Server-side guards in every admin action; ownership checks on orders/addresses |
| Credential stuffing | Rate limiting (DB-backed) + Cloudflare WAF rate rules; generic login errors |
| Price tampering | Server recomputes all money; client sends only IDs/qty |
| Secrets | Only in env/Wrangler secrets; `NEXT_PUBLIC_*` never contains secrets; env validated at startup with zod |
| Clickjacking | `X-Frame-Options: DENY`, `frame-ancestors 'none'` |
| Uploads | MIME/extension allow-list, size limit, random keys, staff-only |

Headers set in `next.config.ts`: CSP, HSTS (prod), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

## 13. Performance requirements

- Home/category/product TTFB p95 < 500 ms; LCP < 2.5 s on 4G.
- JS on storefront pages < 150 KB gzip (mostly Server Components).
- DB queries per page ≤ 6; all list queries paginated.

## 14. Backup strategy

- Managed Postgres point-in-time recovery (Neon: 7–30 days history depending on plan).
- Nightly logical backup (`pg_dump`) via scheduled CI job to an R2 backup bucket, 30-day retention.
- R2 media bucket: object versioning / periodic `rclone` sync to a second bucket.
- Quarterly restore drill.

## 15. Deployment architecture

- Cloudflare Worker `freshmart` built with `opennextjs-cloudflare build`, deployed with `opennextjs-cloudflare deploy`.
- Bindings (`wrangler.jsonc`): `ASSETS`, `HYPERDRIVE` (Postgres), `MEDIA` (R2), `WORKER_SELF_REFERENCE`.
- Environments: `development` (local embedded Postgres), `preview`/`staging` (separate DB branch + bucket), `production`.
- CI: typecheck → lint → unit tests → build → migrate → deploy.
- Full instructions: `README.md` → "Deployment".

### Environment variables

| Name | Required | Notes |
|---|---|---|
| `DATABASE_URL` | dev / scripts | Direct Postgres URL (migrations, seed). On Workers the app uses `HYPERDRIVE`. |
| `APP_URL` | yes | Public base URL, used for callbacks & sitemap. Validated at startup (`src/lib/env.ts`). |
| `SSLCOMMERZ_SANDBOX` | optional | `false` switches SSLCommerz to live mode (default sandbox) |
| `RESEND_API_KEY`, `EMAIL_FROM` | optional | Transactional email |
| `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_SANDBOX` | optional | Enables online payment |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | seed only | First super-admin; never committed |

## 16. Third-party integrations

| Service | Status | Notes |
|---|---|---|
| Cloudflare Workers / R2 / Hyperdrive | Required | Hosting, media, DB pooling |
| PostgreSQL provider (Neon recommended) | Required | Any PG 15+ reachable by Hyperdrive |
| SSLCommerz | Optional, disabled until configured | Implemented per public v4 API; **must be verified in sandbox before enabling** |
| Resend | Optional | Password reset & order emails |
| Google Fonts via `next/font` | Build-time | Self-hosted at build |
