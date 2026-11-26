# FreshMart — UI/UX Design System

The approved FreshMart reference (green announcement bar, leaf logo, pill search, "Deliver to" selector, wide produce hero with a "100% Fresh" seal, category rail, product cards with "Fresh" badges, delivery promo, special-offer card and trust strip) is the visual direction. We translate its **language** — fresh greens, warm produce colour, rounded white cards, confident bold headings — into reusable tokens and components rather than copying it pixel by pixel.

Tokens live in `src/app/globals.css` (`@theme`), components in `src/components/ui` and `src/components/store`.

---

## 1. Brand foundations

### 1.1 Colour tokens

| Token | Hex | Use | Contrast on white |
|---|---|---|---|
| `brand-900` Deep Fresh Green | `#0B4D2C` | Announcement bar, footer, headings accent | 10.6:1 |
| `brand-700` Primary | `#166B3A` | Primary buttons, links, active nav | 6.6:1 |
| `brand-600` | `#1E8449` | Hover/pressed states, icons | 4.9:1 |
| `leaf-500` Natural Leaf Green | `#3FA34D` | Badges, illustrations, progress | decorative / large text |
| `lime-400` Fresh Lime | `#A3D94B` | Accent highlights, ribbons (with dark text) | use with `brand-900` text |
| `sun-400` Offer Yellow | `#FFC83D` | Special-offer ribbons, "Shop now" on dark green | use with `brand-900` text |
| `tomato-500` | `#E5484D` | Discount badges, errors, cart count | 4.0:1 (bold/large only) — text uses `tomato-600 #C9353A` (5.2:1) |
| `ink-900` | `#14231A` | Body headings | 15:1 |
| `ink-600` | `#4A5A50` | Body text secondary | 7.2:1 |
| `ink-400` | `#8A968F` | Placeholders, meta | 3.1:1 (non-essential only) |
| `line` | `#E4EBE6` | Borders, dividers | — |
| `surface` | `#FFFFFF` | Cards | — |
| `canvas` Soft Off-white | `#F6F9F4` | Page sections background | — |
| `mint-50` | `#EEF7EC` | Category rail, trust strip, tinted panels | — |

Rules: white text only on `brand-700`/`brand-900`; yellow/lime surfaces always carry `brand-900` text; never convey state with colour alone (pair with icon/text).

### 1.2 Typography

- **Display/headings:** *Poppins* 600/700/800 (geometric, bold like the reference hero).
- **Body/UI:** *Inter* 400/500/600.
- Scale (rem): `xs .75` · `sm .875` · `base 1` · `lg 1.125` · `xl 1.25` · `2xl 1.5` · `3xl 1.875` · `4xl 2.25` · `5xl 3` · `6xl 3.75` (hero, desktop only).
- Line-height 1.15 for display, 1.5 for body. Prices use tabular numerals (`tabular-nums`).

### 1.3 Spacing, radius, elevation

- 4 px base grid. Section vertical rhythm: `py-10` mobile, `py-16` desktop. Container `max-w-[1320px] px-4 sm:px-6`.
- Radius: `sm 8px` inputs/badges · `md 12px` buttons · `lg 16px` cards · `xl 24px` banners · `full` pills.
- Shadows: `card` `0 1px 2px rgb(16 40 24/.06), 0 4px 16px rgb(16 40 24/.06)`; `card-hover` `0 8px 28px rgb(16 40 24/.12)`; `pop` for menus.
- Motion: 150–250 ms `ease-out`; hover lift `-translate-y-0.5`; respect `prefers-reduced-motion`.

### 1.4 Iconography & imagery

- lucide-react, 1.75 stroke, 18–20 px in UI, 24 px in feature strips.
- Product imagery: square crop (`object-cover`) of real photos from the owner's library (`public/images/photos/`, sourced from `website-images/`). Prefer centred produce, consistent lighting, ≥ 800 px. SVG illustrations in `public/images/products/` remain only as a fallback.
- Hero: slide 1 keeps the illustrated basket (closest to the approved reference); slides 2–3 use photo banners in a rounded white-bordered frame.
- Hero/banners: produce composition on soft green gradient, left-aligned copy.

## 2. Core components

| Component | Variants / states |
|---|---|
| Button | `primary` (brand-700), `secondary` (white + border), `accent` (sun-400 + brand-900 text), `ghost`, `danger`; sizes sm/md/lg; loading spinner; disabled |
| Input / Textarea / Select | label, hint, error text (`aria-describedby`), focus ring `brand-600` 2 px |
| Badge | fresh (leaf), organic, sale (tomato), status badges for orders/payments |
| Card | default, interactive (hover lift) |
| ProductCard | see §3 |
| QtyStepper | – / value / +, min 1, max stock, 44 px targets |
| Skeleton | product card, table rows, text lines |
| EmptyState | icon, title, body, CTA |
| ErrorState / Alert | info, success, warning, error |
| Pagination | prev/next + numbers, URL-driven |
| Tabs, Accordion, Drawer (mobile menu) | keyboard accessible |
| StatusTimeline | order history |
| DataTable (admin) | sortable header, row actions, empty/loading |

## 3. Product card spec

```
┌──────────────────────────┐
│ [-15%]            [♡]    │  discount badge (if compare-at) · wishlist toggle
│        (image 1:1)        │
│ [Fresh] [Organic]         │  freshness / organic badges
│ Red Apple                 │  name (2 lines max)
│ ★ 4.6 (23)                │  rating (only if rating_count > 0)
│ ৳120 ৳140  / kg           │  price · compare-at (strike) · unit
│ [ 🛒 Add to Cart ]        │  disabled "Out of stock" when stock = 0
└──────────────────────────┘
```

- Whole card links to product; buttons are separate focus targets.
- Multi-variant products: Add to Cart adds the default variant; label shows "From ৳…" if prices differ.
- Hover (desktop): shadow `card-hover`, image scale 1.04.

## 4. Page guidelines

### 4.1 Homepage
Order: announcement bar → header (logo, pill search, deliver-to, account, cart) → nav (All Categories button + links) → hero carousel (3 slides, auto-advance 6 s, pause on hover, dots + swipe) → category rail (horizontal scroll on mobile) → trust strip → featured products + side promos (delivery promo left, special offer right on ≥ xl; stacked on mobile) → organic promo → discount banner → best sellers → seasonal → testimonials (only real approved reviews) → newsletter → footer.

### 4.2 Product listing (shop/category/search/organic/offers)
- Breadcrumb + title + result count. Desktop: 260 px filter sidebar + grid (4–5 cols). Mobile: "Filters" button opens drawer; sort select stays visible.
- Grid: 2 cols mobile, 3 tablet, 4 desktop, 5 at ≥ 1440 px.
- Loading skeleton grid; empty state with "Clear filters".

### 4.3 Product details
- Two columns ≥ lg: gallery (main + thumbs) | info panel. Mobile: gallery then info, sticky bottom Add-to-Cart bar.
- Variant chips with price; stock indicator ("In stock", "Only 3 left", "Out of stock").
- Trust bullets (Fresh guarantee, Delivery ETA, Easy returns). Tabs: Description / Reviews.

### 4.4 Shopping cart
- Lines: thumb, name + variant, unit price, stepper, line total, remove. Summary card sticky on desktop.
- Free-delivery progress bar ("Add ৳X more for free delivery").
- Unavailable lines highlighted with warning and excluded from total.

### 4.5 Checkout
- Single page, numbered sections: 1 Address · 2 Delivery · 3 Payment · Summary sidebar.
- Saved addresses as selectable cards; "Add new" inline form.
- Coupon field with apply/remove and inline result.
- Place order button shows total; disabled while submitting.

### 4.6 Customer account
- Left nav (desktop) / horizontal tabs (mobile): Overview, Orders, Wishlist, Addresses, Profile, Sign out.
- Orders as cards on mobile, table on desktop; status badges; timeline on detail.

### 4.7 Admin dashboard
- Dark-green sidebar (brand-900) with icons + labels, collapsible on mobile; white topbar with staff name.
- Content on `canvas` background; StatCards in 4-col grid; tables in white cards; forms in two-column layout on desktop.
- Destructive actions require confirmation dialog.

## 5. States

| State | Pattern |
|---|---|
| Loading | Skeletons matching final layout (`loading.tsx`) |
| Empty | EmptyState with friendly copy + CTA |
| Error | Inline Alert for form errors; `error.tsx` with "Try again" for page errors |
| Success | Toast-like inline Alert; redirect where appropriate |
| Disabled | 50% opacity + `cursor-not-allowed` + reason text |

## 6. Responsive breakpoints

`sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1440`. Mobile header: logo + cart + menu, search on its own row. Announcement bar collapses to a single rotating message on mobile.

## 7. Accessibility checklist

- Contrast per §1.1; focus visible on all interactive elements; skip-to-content link.
- Labels for every input; errors announced via `aria-live="polite"`.
- Carousel: pause control, `aria-roledescription="carousel"`, slides labelled.
- Images: meaningful `alt`; decorative illustrations `alt=""`.
- Tap targets ≥ 44 px; no hover-only functionality.

## 8. Content voice

Warm, short and honest: "Picked fresh this morning", "Add ৳150 more for free delivery". Avoid exaggerated claims that the business can't guarantee.
