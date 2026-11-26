/** Admin sidebar items and the permission each needs (shared by server layout and client shell). */
export const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard", perm: "dashboard:read" },
  { href: "/admin/orders", label: "Orders", icon: "orders", perm: "orders:write" },
  { href: "/admin/products", label: "Products", icon: "products", perm: "products:write" },
  { href: "/admin/categories", label: "Categories", icon: "categories", perm: "products:write" },
  { href: "/admin/inventory", label: "Inventory", icon: "inventory", perm: "inventory:write" },
  { href: "/admin/customers", label: "Customers", icon: "customers", perm: "customers:read" },
  { href: "/admin/messages", label: "Messages", icon: "messages", perm: "customers:read" },
  { href: "/admin/reviews", label: "Reviews", icon: "reviews", perm: "reviews:write" },
  { href: "/admin/coupons", label: "Coupons", icon: "coupons", perm: "coupons:write" },
  { href: "/admin/delivery", label: "Delivery", icon: "delivery", perm: "delivery:write" },
  { href: "/admin/payments", label: "Payments", icon: "payments", perm: "payments:read" },
  { href: "/admin/reports", label: "Reports", icon: "reports", perm: "reports:read" },
  { href: "/admin/settings", label: "Settings", icon: "settings", perm: "settings:write" },
  { href: "/admin/users", label: "Staff users", icon: "users", perm: "users:write" },
  { href: "/admin/roles", label: "Roles", icon: "roles", perm: "roles:write" },
] as const;
