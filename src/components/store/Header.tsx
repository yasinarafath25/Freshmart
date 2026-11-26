import Link from "next/link";
import { Apple, BadgePercent, Carrot, Headphones, Home, Info, Leaf, Mail, ShieldCheck, ShoppingBasket, Sprout, Truck, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getCart, getPreferredZone } from "@/lib/services/cart";
import { getSettings } from "@/lib/services/settings";
import { listCategories } from "@/lib/services/catalog";
import { formatMoney } from "@/lib/utils/money";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { ZoneSelector } from "./ZoneSelector";
import { CategoryMenu, MobileMenu } from "./HeaderClient";
import { NavLinks } from "./NavLinks";

const announcementIcons = [Truck, ShieldCheck, Headphones];

export const NAV = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/fruits", label: "Fruits", icon: "apple" },
  { href: "/vegetables", label: "Vegetables", icon: "carrot" },
  { href: "/groceries", label: "Groceries", icon: "basket" },
  { href: "/spices", label: "Spices & Herbs", icon: "sprout" },
  { href: "/organic", label: "Organic", icon: "leaf" },
  { href: "/offers", label: "Offers", icon: "percent" },
  { href: "/about", label: "About Us", icon: "info" },
  { href: "/contact", label: "Contact", icon: "mail" },
] as const;

export const NAV_ICONS = { home: Home, apple: Apple, carrot: Carrot, basket: ShoppingBasket, sprout: Sprout, leaf: Leaf, percent: BadgePercent, info: Info, mail: Mail };

export async function Header() {
  const [user, cart, { zones, zone }, settings, categories] = await Promise.all([
    getCurrentUser(),
    getCart(),
    getPreferredZone(),
    getSettings(),
    listCategories(),
  ]);
  const count = cart.lines.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = cart.lines.filter((l) => l.available).reduce((s, l) => s + l.lineTotal, 0);
  const accountHref = user ? (user.role === "staff" ? "/admin/dashboard" : "/account") : "/login";
  const topCats = categories.filter((c) => !c.parentId);

  return (
    <header className="relative z-30">
      {/* Announcement bar */}
      <div className="bg-brand-900 text-white">
        <div className="container-page flex h-10 items-center justify-between gap-4 text-[13px] font-medium">
          <ul className="flex min-w-0 items-center gap-6">
            {settings.announcements.map((a, i) => {
              const Icon = announcementIcons[i % announcementIcons.length];
              return (
                <li key={i} className={`items-center gap-2 ${i === 0 ? "flex truncate" : "hidden md:flex"} ${i > 0 ? "md:border-l md:border-white/25 md:pl-6" : ""}`}>
                  <Icon className="size-4 shrink-0 text-lime-400" aria-hidden />
                  <span className="truncate">{a}</span>
                </li>
              );
            })}
          </ul>
          <div className="hidden items-center gap-5 sm:flex">
            <Link href={accountHref} className="flex items-center gap-1.5 hover:text-lime-400">
              <User className="size-4" aria-hidden />
              {user ? `Hi, ${user.name.split(" ")[0]}` : "Login / Register"}
            </Link>
            <Link href="/cart" className="flex items-center gap-1.5 border-l border-white/25 pl-5 hover:text-lime-400">
              <span className="tabular-nums">{formatMoney(cartTotal, settings.currencySymbol)}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b border-line bg-white">
        <div className="container-page flex items-center gap-3 py-3 lg:gap-8 lg:py-4">
          <MobileMenu nav={NAV.map(({ href, label }) => ({ href, label }))} categories={topCats.map((c) => ({ href: `/category/${c.slug}`, label: c.name }))} signedIn={!!user} accountHref={accountHref} />
          <Logo name={settings.storeName} tagline={settings.tagline} />
          <div className="hidden flex-1 md:block">
            <SearchBar />
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <ZoneSelector zones={zones.map((z) => ({ id: z.id, name: z.name }))} currentId={zone?.id ?? null} fallback={settings.defaultLocation} />
            <Link href={accountHref} className="grid size-11 place-items-center rounded-full text-ink-900 hover:bg-mint-50 sm:hidden" aria-label="Account">
              <User className="size-5" />
            </Link>
            <Link
              href="/cart"
              className="relative grid size-11 place-items-center rounded-full bg-mint-50 text-brand-700 transition hover:bg-brand-100"
              aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            >
              <ShoppingBasket className="size-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-tomato-500 px-1 text-[11px] font-bold leading-5 text-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </div>
        </div>
        <div className="container-page pb-3 md:hidden">
          <SearchBar compact />
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Main" className="hidden border-b border-line bg-white lg:block">
        <div className="container-page flex h-14 items-center gap-6">
          <CategoryMenu categories={topCats.map((c) => ({ href: `/category/${c.slug}`, label: c.name, image: c.image }))} />
          <NavLinks items={NAV.map(({ href, label, icon }) => ({ href, label, icon }))} />
        </div>
      </nav>
    </header>
  );
}
