// Route smoke test: every public route must render (2xx), protected routes must not leak content to guests.
// Usage: BASE_URL=http://localhost:3000 npm run smoke
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const publicRoutes = [
  "/", "/shop", "/shop?sort=price_asc&organic=1", "/fruits", "/vegetables", "/groceries", "/spices", "/organic", "/offers",
  "/category/leafy-greens", "/product/red-apple", "/search?q=tom", "/search?q=zzzz-nothing", "/cart", "/login", "/register",
  "/forgot-password", "/reset-password", "/about", "/contact", "/faq", "/privacy-policy", "/terms", "/refund-policy",
  "/sitemap.xml", "/robots.txt", "/api/health", "/api/products?q=apple", "/api/cart", "/admin/login",
];
const notFound = ["/product/does-not-exist", "/category/nope", "/no-such-page", "/media/products/x.jpg"];
const guarded = [
  ["/account", "/login"], ["/account/orders", "/login"], ["/checkout", "/login"], ["/wishlist", "/account/wishlist"],
  ["/admin/dashboard", "/admin/login"], ["/admin/products", "/admin/login"], ["/admin/orders", "/admin/login"], ["/admin/settings", "/admin/login"],
];

let failed = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failed++;
};

for (const r of publicRoutes) {
  const res = await fetch(BASE + r, { redirect: "manual" });
  check(res.status >= 200 && res.status < 300, `${res.status} ${r}`);
}
for (const r of notFound) {
  const res = await fetch(BASE + r, { redirect: "manual" });
  check(res.status === 404, `${res.status} ${r} (expect 404)`);
}
for (const [r, target] of guarded) {
  const res = await fetch(BASE + r, { redirect: "manual" });
  const body = res.status < 300 ? await res.text() : "";
  const loc = res.headers.get("location") ?? "";
  const redirected = (res.status >= 300 && res.status < 400 && loc.includes(target)) || body.includes(`NEXT_REDIRECT;replace;${target}`);
  check(redirected, `${r} → ${target} (status ${res.status})`);
}
const export403 = await fetch(BASE + "/admin/reports/export");
check(export403.status === 403, `${export403.status} /admin/reports/export (guest, expect 403)`);
const forged = await fetch(BASE + "/api/payments/sslcommerz/success", { method: "POST", body: new URLSearchParams({ val_id: "forged", tran_id: "FM-000000-XXXXX-1" }), redirect: "manual" });
check(forged.status === 303 && !(forged.headers.get("location") ?? "").includes("/checkout/success"), `forged payment callback not accepted (${forged.status} → ${forged.headers.get("location")})`);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll smoke checks passed");
process.exit(failed ? 1 : 0);
