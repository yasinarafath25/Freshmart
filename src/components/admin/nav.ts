/** Admin sidebar items, grouped, with the permission each needs (shared by server layout and client shell). */
export const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", labelBn: "ড্যাশবোর্ড", icon: "dashboard", perm: "dashboard:read", group: "main" },
  { href: "/admin/orders", label: "Orders", labelBn: "অর্ডার", icon: "orders", perm: "orders:write", group: "sales" },
  { href: "/admin/payments", label: "Payments", labelBn: "পেমেন্ট", icon: "payments", perm: "payments:read", group: "sales" },
  { href: "/admin/coupons", label: "Coupons", labelBn: "কুপন ও অফার", icon: "coupons", perm: "coupons:write", group: "sales" },
  { href: "/admin/reports", label: "Reports", labelBn: "রিপোর্ট", icon: "reports", perm: "reports:read", group: "sales" },
  { href: "/admin/products", label: "Products", labelBn: "পণ্য", icon: "products", perm: "products:write", group: "catalog" },
  { href: "/admin/categories", label: "Categories", labelBn: "ক্যাটাগরি", icon: "categories", perm: "products:write", group: "catalog" },
  { href: "/admin/inventory", label: "Inventory", labelBn: "স্টক", icon: "inventory", perm: "inventory:write", group: "catalog" },
  { href: "/admin/reviews", label: "Reviews", labelBn: "রিভিউ", icon: "reviews", perm: "reviews:write", group: "catalog" },
  { href: "/admin/customers", label: "Customers", labelBn: "গ্রাহক", icon: "customers", perm: "customers:read", group: "people" },
  { href: "/admin/messages", label: "Messages", labelBn: "মেসেজ", icon: "messages", perm: "customers:read", group: "people" },
  { href: "/admin/delivery", label: "Delivery", labelBn: "ডেলিভারি", icon: "delivery", perm: "delivery:write", group: "setup" },
  { href: "/admin/settings", label: "Settings", labelBn: "সেটিংস", icon: "settings", perm: "settings:write", group: "setup" },
  { href: "/admin/users", label: "Staff users", labelBn: "স্টাফ", icon: "users", perm: "users:write", group: "setup" },
  { href: "/admin/roles", label: "Roles", labelBn: "রোল ও অনুমতি", icon: "roles", perm: "roles:write", group: "setup" },
] as const;

export const NAV_GROUPS: Record<string, { en: string; bn: string }> = {
  main: { en: "", bn: "" },
  sales: { en: "Sales", bn: "বিক্রি" },
  catalog: { en: "Catalog", bn: "পণ্য তালিকা" },
  people: { en: "Customers", bn: "গ্রাহক" },
  setup: { en: "Store setup", bn: "স্টোর সেটআপ" },
};
