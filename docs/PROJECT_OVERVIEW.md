# FreshMart — Project Overview

> Premium fresh grocery e-commerce marketplace for fruits, vegetables, groceries, spices, grains and daily essentials.
> Working name: **FreshMart** ("Eat Fresh, Live Healthy"). Repository folder: `Bangla Bazar`.
> Store name, currency, delivery fees and contact details are runtime settings (Admin → Settings), not hard-coded.

Related documents: [PRD](PRD.md) · [TRD](TRD.md) · [Route map](ROUTE_MAP.md) · [Design system](UI_UX_DESIGN_SYSTEM.md) · [Roadmap](DEVELOPMENT_ROADMAP.md)

---

## 1. Overview and objectives

FreshMart is a single-vendor online grocery store. The business buys fresh produce and packaged groceries, lists them online, and delivers them to customers' doors inside configured delivery zones (launch zone: Karimganj and surroundings).

Objectives:

1. Let customers find, compare and buy fresh produce in under two minutes on a phone.
2. Give the store team one dashboard to manage catalog, stock, orders, deliveries, coupons and payments.
3. Build trust through a premium, clean visual identity, honest freshness information and dependable delivery.
4. Run on Cloudflare's edge with low hosting cost and fast page loads on mobile networks.

## 2. Business model

| Stream | Description |
|---|---|
| Product margin | Primary revenue: retail price minus purchase cost. |
| Delivery fee | Per-zone fee; waived above a configurable order threshold (default ৳999). |
| Promotions | Coupons and sale prices drive repeat orders (cost absorbed in margin). |
| Future | Subscriptions (weekly veg box), B2B bulk orders, sponsored placements (see §11). |

Payment: Cash on Delivery (COD) at launch; online gateway (SSLCommerz) is implemented behind configuration and is enabled only when merchant credentials are supplied.

## 3. Target customers

- Urban and semi-urban households who shop for vegetables several times a week.
- Working professionals with little time for markets.
- Elderly customers and families who value home delivery.
- Health-conscious buyers looking for organic and seasonal produce.
- Small restaurants and caterers (future B2B).

## 4. User roles and permissions

| Role | Type | Summary |
|---|---|---|
| Guest | Anonymous | Browse, search, view products, use cart (cookie-based). Must sign in to check out, review or wishlist. |
| Customer | `users.role = customer` | Everything a guest can do + checkout, orders, cancellations, addresses, wishlist, reviews, notifications. |
| Staff | `users.role = staff` + a staff role | Access to `/admin` limited by the permissions of their assigned role. |
| Super Admin | Staff role with `*` permission | Full access including admin users, roles and settings. |

Seeded staff roles (editable in Admin → Roles):

| Permission | Super Admin | Manager | Staff |
|---|:-:|:-:|:-:|
| `dashboard:read` | ✔ | ✔ | ✔ |
| `products:write` (incl. categories) | ✔ | ✔ | – |
| `inventory:write` | ✔ | ✔ | ✔ |
| `orders:write` | ✔ | ✔ | ✔ |
| `customers:read` / `customers:write` | ✔ | ✔ / ✔ | ✔ / – |
| `coupons:write` | ✔ | ✔ | – |
| `delivery:write` | ✔ | ✔ | – |
| `payments:read` | ✔ | ✔ | – |
| `reviews:write` | ✔ | ✔ | ✔ |
| `reports:read` | ✔ | ✔ | – |
| `settings:write` | ✔ | – | – |
| `users:write` / `roles:write` | ✔ | – | – |

Permissions are always enforced on the server (page loaders and server actions), never only by hiding buttons.

## 5. Main website features

Storefront: homepage, category pages, shop with filters/sort, search, product details with variants, offers page, organic page, cart, wishlist, checkout (COD + configurable online payment), customer account (profile, addresses, orders, wishlist, notifications), reviews, newsletter, contact form, static policy pages.

Admin: dashboard KPIs, products (CRUD, variants, images), categories, inventory with movement history, orders with status workflow, customers, coupons, delivery zones, payments ledger, review moderation, reports, settings, admin users and roles, audit log.

## 6. Functional requirements (summary)

Detailed requirements and acceptance criteria live in [PRD.md](PRD.md).

- FR-1 Catalog: categories, products, variants (size/weight), units, sale prices, stock, availability flags.
- FR-2 Discovery: keyword search, category filter, price/organic/in-stock filters, sorting, pagination.
- FR-3 Cart: add/update/remove, stock-aware quantities, persists for guests (cookie) and merges on login.
- FR-4 Checkout: address, delivery zone, delivery slot, coupon, payment method, server-side totals.
- FR-5 Orders: unique order numbers, status tracking, history, cancellation of eligible orders, status timeline.
- FR-6 Payments: COD; online gateway with server-to-server validation; payment ledger.
- FR-7 Accounts: register, login, logout, password reset, profile, addresses.
- FR-8 Engagement: wishlist, verified-purchase reviews, in-app notifications, newsletter.
- FR-9 Admin: management screens listed in §5 with RBAC and audit logging.

## 7. Non-functional requirements

| Area | Target |
|---|---|
| Performance | LCP < 2.5 s on 4G for home/category/product; server response p95 < 500 ms at edge. |
| Availability | 99.9% (Cloudflare Workers + managed Postgres). |
| Security | OWASP Top 10 mitigations; RBAC; hashed passwords (PBKDF2-SHA256); httpOnly sessions; rate limiting; no secrets in client bundles. |
| Accessibility | WCAG 2.1 AA colour contrast, keyboard navigation, labelled forms, alt text. |
| Responsiveness | 360 px → 1536 px+; mobile-first interactions; desktop-quality visuals. |
| SEO | Server-rendered pages, metadata, Open Graph, sitemap.xml, robots.txt, product JSON-LD. |
| Maintainability | TypeScript strict, reusable components, single source of truth for pricing logic, documented architecture. |
| Data integrity | Prices, discounts, stock and payment status computed/verified on the server inside DB transactions. |

## 8. Business rules

1. **Prices are server truth.** Cart and checkout totals are recomputed from the database on every request; the browser only sends variant IDs and quantities.
2. **Money** is stored as integer minor units (paisa); display uses the configured currency symbol (default `৳`).
3. **Stock** is decremented atomically at order placement (`UPDATE … WHERE stock >= qty`). Insufficient stock aborts the whole order.
4. **Cancellation:** a customer may cancel while the order is `pending` or `confirmed`. Staff may cancel any non-delivered order. Cancelling restocks items and voids unpaid payments.
5. **Order status flow:** `pending → confirmed → processing → out_for_delivery → delivered`; `cancelled` from any state before `delivered`.
6. **Delivery fee:** per zone; free when subtotal (after discount) ≥ zone's free-above threshold (default ৳999).
7. **Coupons:** must be active, inside date window, meet minimum order, respect total and per-customer usage limits; one coupon per order; percentage coupons respect `max_discount`.
8. **Reviews:** only customers with a delivered order containing the product may review it; one review per product per customer; reviews are moderated before publication.
9. **Minimum order** value is a setting (default ৳100).
10. **Order numbers** are human-readable and unique: `FM-YYMMDD-XXXXX`.
11. **Online payments** are marked `paid` only after server-side validation with the gateway, never from a browser redirect alone.
12. **Accounts** can be blocked by staff; blocked users cannot log in.

## 9. Core user journeys

1. **First purchase:** Home → category → product → add to cart → cart → login/register → checkout (address, zone, slot, COD) → confirmation → order detail.
2. **Repeat purchase:** Login → search "tomato" → add → cart → checkout using saved default address → confirmation.
3. **Track & cancel:** Account → Orders → order detail timeline → Cancel (if eligible).
4. **Review:** Delivered order → product page → write review → pending moderation → approved by staff → visible.
5. **Staff fulfilment:** Admin login → Orders (pending) → confirm → processing → out for delivery → delivered (COD marked paid).
6. **Catalog upkeep:** Admin → Products → create product with variants and photo → Inventory → restock.
7. **Promotion:** Admin → Coupons → create `FRESH20` → customer applies at checkout.

## 10. Assumptions and limitations

- Single vendor, single warehouse; multi-vendor marketplace is a future enhancement.
- Currency defaults to Bangladeshi Taka (`৳`) as shown in the approved design. **The launch area (Karimganj) must be confirmed by the owner** — if the store operates in India the currency should be switched to `₹` in Settings and an Indian gateway (e.g. Razorpay) added through the payment-provider interface.
- Online payment (SSLCommerz) is implemented against its published API but cannot be verified until real sandbox/merchant credentials are configured. It stays disabled until then.
- Transactional email (password reset, order emails) uses Resend's HTTP API when `RESEND_API_KEY` is set. Without it, emails are written to the server log (development only).
- Seed data contains a starter catalog with **placeholder illustrations and placeholder prices**; the owner must replace them with real photos and prices before launch. No fake reviews or testimonials are seeded.
- SMS/OTP and live delivery-rider tracking are out of scope for launch.

## 11. Future expansion

- Mobile apps (React Native) using the same REST API.
- Subscriptions / recurring baskets; scheduled weekly delivery.
- Multi-vendor marketplace with vendor dashboards and payouts.
- SMS order notifications and OTP login.
- Loyalty points, referral credits, gift cards.
- Rider app with live tracking; route optimisation.
- Bengali / Hindi localisation.
- Recommendation engine ("frequently bought together").
- B2B bulk pricing tiers.
