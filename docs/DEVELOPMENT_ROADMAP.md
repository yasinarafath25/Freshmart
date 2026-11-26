# FreshMart — Development Roadmap

Status keys: ✅ done · 🟡 partial · ⬜ not started. Status is updated as work lands (see §16 for the live tracker).

| # | Phase | Depends on |
|---|---|---|
| 1 | Project setup & architecture | — |
| 2 | Design system & reusable components | 1 |
| 3 | Homepage & navigation | 2 |
| 4 | Product catalog & category pages | 1, 2 |
| 5 | Product details & search | 4 |
| 6 | Cart & wishlist | 5, 7 (wishlist) |
| 7 | Customer authentication & accounts | 1 |
| 8 | Checkout & payments | 6, 7 |
| 9 | Order & delivery management | 8 |
| 10 | Admin dashboard | 7, 9 |
| 11 | Inventory, reports & analytics | 10 |
| 12 | SEO, security & performance | 3–11 |
| 13 | Testing & bug fixing | all |
| 14 | Production deployment | 13 |

---

### Phase 1 — Project setup & architecture
- **Tasks:** Next.js 16 + TS + Tailwind 4 scaffold; ESLint; folder structure (TRD §3); Drizzle schema & first migration; embedded Postgres dev script; env validation; OpenNext + wrangler config; seed script.
- **Deliverables:** `npm run dev` serves the app against local Postgres; `npm run db:migrate` and `db:seed` work.
- **Testing:** typecheck, lint, `/api/health` returns DB ok.
- **Done when:** clean install → dev server in ≤ 5 commands documented in README.

### Phase 2 — Design system & components
- **Tasks:** tokens in `globals.css`; fonts; UI primitives (§2 of design system); product illustrations for seed data; logo.
- **Deliverables:** `components/ui/*`, `components/store/ProductCard`.
- **Testing:** visual check at 360/768/1440; contrast check of token pairs.
- **Done when:** every page uses only shared primitives.

### Phase 3 — Homepage & navigation
- **Tasks:** announcement bar, header (search, deliver-to, account, cart badge), nav, mobile drawer, hero carousel, category rail, trust strip, product sections, promos, testimonials, newsletter, footer.
- **Deliverables:** `/` fully data-driven.
- **Testing:** all links resolve; newsletter stores email; responsive.
- **Done when:** matches design direction and no dead buttons.

### Phase 4 — Catalog & category pages
- **Tasks:** `catalog` service (filters, sort, pagination); `/shop`, category shortcut routes, `/category/[slug]`, `/organic`, `/offers`.
- **Testing:** filter combinations; pagination; inactive items hidden.

### Phase 5 — Product details & search
- **Tasks:** product page with variants, gallery, related, reviews list; `/search`; JSON-LD.
- **Testing:** variant price switching; out-of-stock behaviour; search relevance.

### Phase 6 — Cart & wishlist
- **Tasks:** cookie cart, server actions, cart page, header badge, guest→user merge, wishlist toggle & pages.
- **Testing:** tamper test (prices), stock cap, merge on login.

### Phase 7 — Authentication & accounts
- **Tasks:** password hashing, sessions, register/login/logout, forgot/reset (email provider abstraction), account pages, addresses, notifications, rate limiting.
- **Testing:** session expiry, blocked user, reset token single use, rate limit triggers.

### Phase 8 — Checkout & payments
- **Tasks:** pricing engine, coupon validation, delivery zone fees, slots, idempotent `placeOrder` transaction, COD; SSLCommerz provider (config-gated) with server validation; success page.
- **Testing:** unit tests for pricing/coupons; concurrent stock test; forged callback test.

### Phase 9 — Order & delivery management
- **Tasks:** status workflow, history, notifications, customer cancel + restock, delivery zones admin.
- **Testing:** invalid transitions rejected; restock on cancel.

### Phase 10 — Admin dashboard
- **Tasks:** admin login, shell, RBAC guards, dashboard KPIs/charts, products/categories CRUD with image upload, orders, customers, coupons, delivery, payments, reviews, settings, users, roles, audit log, messages.
- **Testing:** permission matrix per role; CRUD round-trips.

### Phase 11 — Inventory, reports & analytics
- **Tasks:** stock adjustments with movements, low-stock alerts, reports (sales by day/category/product, coupons), CSV export.

### Phase 12 — SEO, security & performance
- **Tasks:** metadata, sitemap, robots, OG; security headers + CSP; rate-limit coverage; query/index review; image loading strategy.

### Phase 13 — Testing & bug fixing
- **Tasks:** Vitest unit tests (pricing, coupons, validation, password, order transitions); scripted smoke test of all routes; manual journey tests desktop/tablet/mobile; fix defects.
- **Done when:** P0 release gate in PRD §6 passes.

### Phase 14 — Production deployment
- **Tasks:** Neon (or other PG) + Hyperdrive, R2 bucket, secrets, `opennextjs-cloudflare deploy`, migrations, create super admin, DNS, WAF rate rules, backups.
- **Deliverables:** README deployment guide + post-deploy checklist.

---

## 15. Documentation review log (Phase 2 of the master plan)

Review performed after drafting all six documents. Findings and corrections:

1. **ORM choice conflict:** brief prefers Prisma; TRD selects Drizzle. Resolved — Drizzle justified in TRD §1.1 (Workers bundle size, unchanged `pg` driver path). All docs reference Drizzle.
2. **Middleware vs Cloudflare:** route guards originally assumed `middleware.ts`. Next 16 `proxy.ts` runs on Node runtime, unsupported by OpenNext Cloudflare → guards moved into layouts + server actions (TRD §1.1, ROUTE_MAP header).
3. **Testimonials data source:** PRD forbids fake data; design asks for testimonials. Resolved: testimonials = approved ≥ 4★ reviews; section hidden when none (ROUTE_MAP `/`, Design §4.1).
4. **Public coupons on `/offers`:** required an `is_public` flag not in the TRD table → added to `coupons` (implemented in schema).
5. **Contact messages:** PRD stores contact form in DB but ROUTE_MAP had no admin screen → added `/admin/messages`.
6. **Idempotent checkout:** PRD requires double-submit protection → `orders.checkout_token` unique column added to TRD.
7. **Currency/market ambiguity:** design shows `৳` while launch area is Karimganj → currency is a setting; flagged as an owner decision in PROJECT_OVERVIEW §10.
8. **Permissions naming:** unified to `area:verb` across overview, route map and code (`products:write` also covers categories).
9. **Wishlist route duplication:** `/wishlist` kept for the nav link, redirects to `/account/wishlist`.
10. **Images on Workers:** `sharp`/Next image optimiser unavailable by default → plain responsive `<img>` + optional Cloudflare Image Resizing (TRD §11).

Dependencies confirmed missing from the empty repo and installed in Phase 1: next, react, react-dom, tailwindcss, @tailwindcss/postcss, lucide-react, zod, drizzle-orm, pg, drizzle-kit, embedded-postgres (dev), @opennextjs/cloudflare, wrangler, vitest, tsx, typescript, eslint.

## 16. Live status tracker

Updated at the end of each work session — see README "Project status" for the full snapshot.

| Phase | Status (2026-11-27) |
|---|---|
| 1 Setup & architecture | ✅ |
| 2 Design system | ✅ (placeholder SVG product art — real photos pending) |
| 3 Homepage & navigation | ✅ |
| 4 Catalog & categories | ✅ |
| 5 Product details & search | ✅ |
| 6 Cart & wishlist | ✅ |
| 7 Auth & accounts | ✅ (email delivery untested without Resend key) |
| 8 Checkout & payments | 🟡 COD ✅ · SSLCommerz implemented, untested (no sandbox credentials) |
| 9 Orders & delivery | ✅ |
| 10 Admin dashboard | ✅ (audit-log viewer screen not built; rows are recorded) |
| 11 Inventory & reports | ✅ |
| 12 SEO, security, performance | ✅ (Lighthouse not yet measured) |
| 13 Testing | 🟡 unit tests + route smoke test + manual browser journeys; no automated E2E suite |
| 14 Deployment | 🟡 config & guide ready; Workers build must run in WSL/CI (Windows symlink limit) |

Changes found during implementation (kept in sync with TRD): store time zone setting (`timeZone`) for delivery dates, order numbers and reports; `SESSION_SECRET` dropped (sessions need no signing key); `pg` bundled rather than externalised.
