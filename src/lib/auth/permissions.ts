export const PERMISSIONS = [
  "dashboard:read",
  "products:write",
  "inventory:write",
  "orders:write",
  "customers:read",
  "customers:write",
  "coupons:write",
  "delivery:write",
  "payments:read",
  "reviews:write",
  "reports:read",
  "settings:write",
  "users:write",
  "roles:write",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "dashboard:read": "View dashboard",
  "products:write": "Manage products & categories",
  "inventory:write": "Manage inventory",
  "orders:write": "Manage orders",
  "customers:read": "View customers & messages",
  "customers:write": "Block / unblock customers",
  "coupons:write": "Manage coupons",
  "delivery:write": "Manage delivery zones",
  "payments:read": "View payments",
  "reviews:write": "Moderate reviews",
  "reports:read": "View reports",
  "settings:write": "Edit store settings",
  "users:write": "Manage staff users",
  "roles:write": "Manage roles",
};

export function hasPermission(perms: readonly string[] | null | undefined, p: Permission): boolean {
  if (!perms) return false;
  return perms.includes("*") || perms.includes(p);
}
