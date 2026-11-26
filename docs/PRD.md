# FreshMart — Product Requirements Document (PRD)

Version 1.0 · Status: Approved for build · Priority keys: **P0** launch-critical · **P1** important · **P2** future

---

## 1. Product vision

"The freshest market in town, one tap away." FreshMart makes buying fresh produce online feel as trustworthy as picking it by hand: honest photos, freshness badges, transparent prices per unit, and fast, reliable delivery.

## 2. Business goals

| Goal | Metric (first 6 months) |
|---|---|
| Acquire customers | 2,000 registered customers |
| Conversion | ≥ 3% session-to-order |
| Retention | ≥ 40% of customers order again within 30 days |
| Basket size | Average order ≥ ৳800 |
| Operations | ≥ 95% of orders delivered in the promised slot |

## 3. Personas

| Persona | Needs | Pain points today |
|---|---|---|
| **Rina, 34, working parent** | Weekly vegetables, quick reorder, evening delivery slot | No time for bazaar; inconsistent quality |
| **Mr. Das, 62, retiree** | Large text, simple flow, cash on delivery | Distrusts online payment; heavy bags |
| **Arif, 27, health-focused** | Organic and seasonal produce, clear origin info | Hard to find genuine organic items |
| **Hotel kitchen buyer** (P2) | Bulk quantities, invoices | Manual phone orders |

## 4. Problems → solutions

| Problem | Solution |
|---|---|
| Can't judge freshness online | Freshness badge, origin, harvest notes, verified-purchase reviews |
| Confusing pricing by weight | Explicit unit (`/kg`, `/piece`, `/bunch`) and variants (500 g / 1 kg) |
| Fear of online payment | COD by default; online payment only via trusted gateway |
| Unreliable delivery time | Delivery zones with ETA text and selectable slots |
| Hard to find items | Prominent search, category rail, filters and sorting |

---

## 5. Feature requirements

### 5.1 Customer registration & authentication — P0
- Register with name, email, phone (optional), password (≥ 8 chars, letters + numbers).
- Login with email + password; "remember me" 30-day session, otherwise 1 day.
- Logout invalidates the server session.
- Forgot password: emailed single-use token valid 60 minutes; reset invalidates other sessions.
- Rate limit: 5 login attempts / 15 min per IP+email; 5 registrations / hour per IP.
- Guest cart merges into the account cart on login.

**Acceptance:** duplicate email rejected with a clear message; wrong password shows a generic error; session cookie is `HttpOnly`, `Secure` (prod), `SameSite=Lax`; blocked users cannot log in; reset link works once.

### 5.2 Product discovery & search — P0
- Header search on every page; results page `/search?q=` matching name, description and category (case-insensitive).
- Filters: category, price range, organic, in stock, on sale. Sort: popularity, newest, price ↑/↓, name.
- Pagination (24 per page). Empty and no-result states with suggestions.

**Acceptance:** "toma" finds Tomato; filters combine (AND); URL reflects filters so links are shareable; results load server-side (SEO).

### 5.3 Product categories — P0
- Admin-managed categories with name, slug, image, description, sort order, active flag; optional parent.
- Category rail on home; dedicated pages `/fruits`, `/vegetables`, `/groceries`, `/spices`, generic `/category/[slug]`.

**Acceptance:** inactive categories are hidden from storefront; category page lists only active products in that category (incl. child categories).

### 5.4 Product details — P0
- Gallery, name, unit, variant selector (e.g. 500 g / 1 kg), price, compare-at price + discount %, stock status, freshness badge, organic badge, origin, description, rating summary, reviews, related products.
- Quantity stepper bounded by stock; Add to cart; Wishlist toggle.

**Acceptance:** out-of-stock variants can't be added; price updates when variant changes; JSON-LD `Product` present.

### 5.5 Shopping cart — P0
- Cookie-identified server cart for guests; user cart after login (merged).
- Update quantity, remove, clear; line totals and subtotal from DB prices; free-delivery progress bar.
- Items whose product became inactive or out of stock are flagged and excluded from checkout.

**Acceptance:** tampering with prices in the browser has no effect; quantity cannot exceed stock; header cart badge reflects item count.

### 5.6 Checkout — P0
- Requires login. Steps on a single page: address (saved or new), delivery zone, delivery slot (Morning / Afternoon / Evening, next 3 days), coupon, payment method, order notes, summary.
- Server recomputes everything inside a DB transaction and decrements stock atomically.
- Minimum order value enforced.

**Acceptance:** order succeeds only if every item is in stock; double-submit doesn't create two orders (idempotency key per checkout form); success page shows order number.

### 5.7 Order management — P0
- Customer: order list, detail with status timeline, cancel while `pending`/`confirmed`.
- Staff: list with filters (status, payment, date, search), detail, status transitions with notes, cancel with restock, mark COD paid on delivery.

**Acceptance:** each status change writes a history row and creates a customer notification; invalid transitions are rejected server-side.

### 5.8 Payment management — P0 (COD) / P1 (online)
- COD: payment row `unpaid` → `paid` when delivered and collected.
- Online (SSLCommerz): initiate session server-side; success/fail/cancel/IPN callbacks; **validate via gateway validation API** before marking paid; amount and currency must match.
- Payments ledger in admin with provider, amount, status, transaction id.
- Provider is hidden at checkout unless its credentials are configured.

**Acceptance:** forged success redirect without valid `val_id` never marks an order paid.

### 5.9 Delivery management — P0
- Delivery zones (name, fee, free-above threshold, ETA text, active).
- Delivery slots configured in settings.
- Header "Deliver to" selector stores preferred zone in a cookie and preselects it at checkout.

**Acceptance:** fee shown in cart/checkout equals server-computed fee for the chosen zone.

### 5.10 Discount & coupon system — P0
- Coupon types: percentage, fixed amount, free delivery. Fields: code, value, min order, max discount, start/end, usage limit, per-customer limit, active.
- Product-level sale prices via variant `compare_at_price`.

**Acceptance:** expired / exhausted / below-minimum coupons are rejected with a specific message; discount never exceeds subtotal.

### 5.11 Customer accounts — P0
- Profile (name, phone), change password, addresses (CRUD, default), orders, wishlist, notifications.

### 5.12 Reviews & ratings — P1
- 1–5 stars + title + text; verified purchase only; moderation queue; product rating aggregate updated on approval.

### 5.13 Wishlist — P1
- Heart toggle on cards and product page; requires login (guests redirected to login and returned).

### 5.14 Notifications — P1
- In-app notifications for order status changes; unread badge in account.
- Email order confirmation when email provider configured (P1). SMS (P2).

### 5.15 Admin dashboard — P0
- KPIs: revenue (paid + delivered COD), orders today / 30 days, customers, average order value, low-stock count, pending orders.
- 14-day revenue/orders chart, latest orders, low-stock list, top products.

### 5.16 Inventory management — P0
- Stock per variant; adjust (+/–) with reason; low-stock threshold setting; movement history (order, cancel, restock, adjustment).

### 5.17 Reports & analytics — P1
- Sales by day for a date range, sales by category, top products, coupon usage, CSV export.

### 5.18 SEO — P0
- Server rendering, unique titles/descriptions, canonical URLs, Open Graph, `sitemap.xml`, `robots.txt`, product & breadcrumb JSON-LD, semantic headings, image alt text.

### 5.19 Mobile experience — P0
- Mobile header with search, bottom-friendly tap targets (≥ 44 px), slide-in menu, sticky add-to-cart on product page, single-column checkout.

### 5.20 Content & support — P1
- About, Contact (form stored in DB, rate-limited), FAQ, Privacy, Terms, Refund policy; newsletter signup.

### 5.21 Admin users, roles & audit — P0
- Create staff users, assign roles, block/unblock; edit role permissions; audit log of admin write actions.

### P2 backlog
Subscriptions, loyalty points, SMS/OTP, multi-vendor, rider tracking, localisation, recommendations, B2B pricing, PWA offline mode.

---

## 6. Acceptance criteria — release gate (P0)

1. A new customer can register, add 3 products, apply a valid coupon, check out with COD and see the order in their account.
2. Staff can move that order through every status to `delivered`; the customer sees each change in the timeline and notifications.
3. Stock decreases on order and is restored on cancellation; movement history shows both.
4. Admin can create/edit/delete a product with two variants and an image; it appears/disappears on the storefront accordingly.
5. Non-staff users receive 404/redirect on every `/admin` route and every admin server action rejects them.
6. All pages render without horizontal scroll at 360 px, 768 px and 1440 px.
7. Lighthouse (mobile) ≥ 85 performance, ≥ 95 accessibility, ≥ 95 SEO on home and product pages.
