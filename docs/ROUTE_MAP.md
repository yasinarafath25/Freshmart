# FreshMart — Route Map

Legend — **Access:** Public · Guest-only (redirects signed-in users) · Customer (signed in) · Staff:`permission`.
Auth is enforced server-side in the route's layout/page **and** in every server action it calls. There is no `middleware.ts` (see TRD §1.1).
Services referenced live in `src/lib/services/*`. "SA" = Server Action.

## 1. Customer-facing routes — `src/app/(store)` unless noted

| Route | Purpose | Access | Main components | Required data | API / actions |
|---|---|---|---|---|---|
| `/` | Homepage | Public | AnnouncementBar, Header, Hero carousel, CategoryRail, TrustStrip, FeaturedProducts, OrganicPromo, DiscountBanner, BestSellers, Seasonal, Testimonials (approved reviews; hidden if none), Newsletter, Footer | categories, featured / best-selling / seasonal / organic products, approved 5★ reviews, settings | `catalog.*`, SA `subscribeNewsletter`, SA `addToCart` |
| `/shop` | All products with filters & sort | Public | FilterSidebar, SortSelect, ProductGrid, Pagination | products (filtered, paginated), categories | `catalog.listProducts` |
| `/fruits` `/vegetables` `/groceries` `/spices` | Shortcut category pages (same view as `/category/[slug]`) | Public | CategoryHeader, FilterSidebar, ProductGrid | category by fixed slug + products | `catalog.getCategory`, `listProducts` |
| `/organic` | Organic products | Public | PageHero, ProductGrid | products `is_organic` | `listProducts({organic})` |
| `/category/[slug]` | Any category | Public | as above; 404 if missing/inactive | category + children + products | `catalog.*` |
| `/product/[slug]` | Product details | Public | Gallery, VariantPicker, QtyStepper, AddToCart, WishlistButton, Reviews, ReviewForm (eligible customers), RelatedProducts, JSON-LD | product, variants, reviews, related, wishlist state, review eligibility | SA `addToCart`, `toggleWishlist`, `submitReview` |
| `/search?q=` | Search results | Public | SearchHeader, FilterSidebar, ProductGrid, EmptyState | products matching q | `listProducts({q})` |
| `/offers` | Discounted products + public coupons | Public | CouponCards, ProductGrid | products with compare-at price, active public coupons | `listProducts({onSale})`, `coupons.listPublic` |
| `/wishlist` | Redirect → `/account/wishlist` | Customer | — | — | — |
| `/cart` | Cart review | Public (cookie cart) | CartLines, QtyStepper, FreeDeliveryProgress, OrderSummary | cart lines with live prices/stock, zone fee estimate | SA `updateCartItem`, `removeCartItem`, `clearCart` |
| `/checkout` | Place order | Customer (redirect to login with `next`) | AddressPicker/AddressForm, ZoneSelect, SlotPicker, CouponField, PaymentMethods, Summary | cart, addresses, zones, settings, enabled payment providers | SA `previewCheckout`, `placeOrder` |
| `/checkout/success/[orderNumber]` | Confirmation | Customer (owner) | SuccessPanel, OrderSummary | order | — |
| `/checkout/pay/[orderNumber]` | Redirect to online gateway | Customer (owner) | — | order, provider session | `payments.initiate` |
| `/login` `(auth)` | Sign in | Guest-only | AuthCard, LoginForm | — | SA `login` (rate-limited) |
| `/register` `(auth)` | Sign up | Guest-only | RegisterForm | — | SA `register` |
| `/forgot-password` `(auth)` | Request reset link | Guest-only | ForgotForm | — | SA `requestPasswordReset` |
| `/reset-password?token=` `(auth)` | Set new password | Public (valid token) | ResetForm | token validity | SA `resetPassword` |
| `/account` | Dashboard: recent orders, notifications | Customer | AccountShell, StatCards, OrderList | orders, notifications | SA `markNotificationsRead`, `logout` |
| `/account/profile` | Edit profile & password | Customer | ProfileForm, PasswordForm | user | SA `updateProfile`, `changePassword` |
| `/account/addresses` | Address book | Customer | AddressCards, AddressForm | addresses, zones | SA `saveAddress`, `deleteAddress`, `setDefaultAddress` |
| `/account/orders` | Order history | Customer | OrderTable/Cards, StatusBadge | orders (paginated) | — |
| `/account/orders/[id]` | Order detail | Customer (owner) | StatusTimeline, Items, Totals, CancelButton | order + items + history + payment | SA `cancelOrder` |
| `/account/wishlist` | Saved products | Customer | ProductGrid, EmptyState | wishlist products | SA `toggleWishlist` |
| `/about` `/faq` `/privacy-policy` `/terms` `/refund-policy` | Content pages | Public | ContentPage, Accordion (FAQ) | settings (store name/contact) | — |
| `/contact` | Contact form | Public | ContactForm, ContactInfo | settings | SA `sendContactMessage` (rate-limited) |
| `/sitemap.xml` `/robots.txt` | SEO | Public | — | active categories/products | — |
| `/media/[...key]` | Uploaded images | Public | — | R2 / local file | route handler |
| `/api/*` | See TRD §6 | varies | — | — | route handlers |

## 2. Admin routes — `src/app/admin`

All routes except `/admin/login` share `AdminShell` (sidebar + topbar) and require `users.role = staff`, `status = active`.

| Route | Purpose | Permission | Main components | Required data | Actions |
|---|---|---|---|---|---|
| `/admin` | Redirect → `/admin/dashboard` | staff | — | — | — |
| `/admin/login` | Staff sign-in | Guest-only | AuthCard | — | SA `adminLogin` |
| `/admin/dashboard` | KPIs, charts, latest orders, low stock | `dashboard:read` | StatCard, BarChart, DataTable | reports.overview | — |
| `/admin/products` | Product list (search, category, status filters) | `products:write` | DataTable, Filters | products + default variant | SA `deleteProduct`, `toggleProductActive` |
| `/admin/products/create` | New product | `products:write` | ProductForm (variants, images, flags) | categories | SA `saveProduct`, `uploadImage` |
| `/admin/products/[id]/edit` | Edit product | `products:write` | ProductForm | product + variants | SA `saveProduct` |
| `/admin/categories` | Category CRUD | `products:write` | CategoryTable, CategoryForm | categories | SA `saveCategory`, `deleteCategory` |
| `/admin/inventory` | Stock per variant, adjust, movements | `inventory:write` | StockTable, AdjustForm, MovementList | variants, movements | SA `adjustStock` |
| `/admin/orders` | Orders list | `orders:write` | Filters, DataTable | orders (paginated) | — |
| `/admin/orders/[id]` | Order detail & workflow | `orders:write` | StatusControl, Timeline, Items, Customer, Payment | order | SA `updateOrderStatus`, `markOrderPaid` |
| `/admin/customers` | Customers list + detail drawer | `customers:read` | DataTable | customers + order stats | SA `setUserStatus` (`customers:write`) |
| `/admin/coupons` | Coupon CRUD | `coupons:write` | CouponTable, CouponForm | coupons | SA `saveCoupon`, `deleteCoupon` |
| `/admin/delivery` | Delivery zones & slots | `delivery:write` | ZoneTable, ZoneForm, SlotSettings | zones, settings | SA `saveZone`, `deleteZone`, `saveSettings` |
| `/admin/payments` | Payment ledger + provider status | `payments:read` | DataTable, ProviderStatus | payments, provider config flags | — |
| `/admin/reviews` | Moderation queue | `reviews:write` | ReviewTable | reviews | SA `moderateReview` |
| `/admin/reports` | Sales/category/product reports, CSV | `reports:read` | DateRange, Charts, Tables | reports.* | `GET /admin/reports/export` (route handler, staff-guarded) |
| `/admin/settings` | Store settings | `settings:write` | SettingsForm | settings | SA `saveSettings` |
| `/admin/users` | Staff users | `users:write` | DataTable, UserForm | staff users, roles | SA `saveStaffUser`, `setUserStatus` |
| `/admin/roles` | Roles & permissions | `roles:write` | RoleTable, PermissionMatrix | roles | SA `saveRole`, `deleteRole` |
| `/admin/messages` | Contact messages inbox (added during review) | `customers:read` | DataTable | contact_messages | SA `markMessageHandled` |

## 3. Redirect & guard rules

| Situation | Result |
|---|---|
| Guest opens customer route | `302 /login?next=<path>` |
| Signed-in user opens `/login` or `/register` | `302 /account` |
| Non-staff opens `/admin/*` | `302 /admin/login` |
| Staff lacking permission | Rendered "No access" state (403) |
| Customer opens someone else's order | 404 |
| Unknown slug / id | `not-found.tsx` (404) |
