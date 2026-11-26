import Link from "next/link";
import { Headphones, ShieldCheck, ShoppingBasket, Truck, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getCart, getPreferredZone } from "@/lib/services/cart";
import { getSettings } from "@/lib/services/settings";
import { listCategories } from "@/lib/services/catalog";
import { getI18n } from "@/lib/i18n/server";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { ZoneSelector } from "./ZoneSelector";
import { CategoryMenu, MobileMenu } from "./HeaderClient";
import { NavLinks } from "./NavLinks";
import { LangSwitch } from "./LangSwitch";

const announcementIcons = [Truck, ShieldCheck, Headphones];

const NAV = [
  { href: "/", key: "home", icon: "home" },
  { href: "/fruits", key: "fruits", icon: "apple" },
  { href: "/vegetables", key: "vegetables", icon: "carrot" },
  { href: "/groceries", key: "groceries", icon: "basket" },
  { href: "/spices", key: "spices", icon: "sprout" },
  { href: "/organic", key: "organic", icon: "leaf" },
  { href: "/offers", key: "offers", icon: "percent" },
  { href: "/about", key: "about", icon: "info" },
  { href: "/contact", key: "contact", icon: "mail" },
] as const;

export async function Header() {
  const [user, cart, { zones, zone }, settings, categories, i] = await Promise.all([
    getCurrentUser(),
    getCart(),
    getPreferredZone(),
    getSettings(),
    listCategories(),
    getI18n(),
  ]);
  const { d } = i;
  const count = cart.lines.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = cart.lines.filter((l) => l.available).reduce((s, l) => s + l.lineTotal, 0);
  const accountHref = user ? (user.role === "staff" ? "/admin/dashboard" : "/account") : "/login";
  const topCats = categories.filter((c) => !c.parentId);
  const nav = NAV.map((n) => ({ href: n.href, label: d.nav[n.key], icon: n.icon }));
  const announcements = i.lang === "bn" ? settings.announcementsBn : settings.announcements;

  return (
    <header className="relative z-30">
      {/* Announcement bar */}
      <div className="bg-brand-900 text-white">
        <div className="container-page flex h-10 items-center justify-between gap-4 text-[13px] font-medium">
          <ul className="flex min-w-0 items-center gap-6">
            {announcements.map((a, idx) => {
              const Icon = announcementIcons[idx % announcementIcons.length];
              return (
                <li key={idx} className={`items-center gap-2 ${idx === 0 ? "flex min-w-0" : "hidden md:flex"} ${idx > 0 ? "md:border-l md:border-white/25 md:pl-6" : ""}`}>
                  <Icon className="size-4 shrink-0 text-lime-400" aria-hidden />
                  <span className="truncate">{a}</span>
                </li>
              );
            })}
          </ul>
          <div className="flex shrink-0 items-center gap-4">
            <LangSwitch variant="dark" />
            <Link href={accountHref} className="hidden items-center gap-1.5 border-l border-white/25 pl-4 hover:text-lime-400 sm:flex">
              <User className="size-4" aria-hidden />
              {user ? d.header.hi(user.name.split(" ")[0]) : d.header.login}
            </Link>
            <Link href="/cart" className="hidden items-center gap-1.5 border-l border-white/25 pl-4 hover:text-lime-400 sm:flex">
              <span className="tabular-nums">{i.money(cartTotal)}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b border-line bg-white">
        <div className="container-page flex items-center gap-3 py-3 lg:gap-8 lg:py-4">
          <MobileMenu
            nav={nav.map(({ href, label }) => ({ href, label }))}
            categories={topCats.map((c) => ({ href: `/category/${c.slug}`, label: i.name(c), image: c.image }))}
            signedIn={!!user}
            accountHref={accountHref}
          />
          <Logo name={settings.storeName} tagline={i.lang === "bn" ? settings.taglineBn : settings.tagline} />
          <div className="hidden flex-1 md:block">
            <SearchBar />
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <ZoneSelector zones={zones.map((z) => ({ id: z.id, name: i.pick(z.name, z.nameBn) }))} currentId={zone?.id ?? null} fallback={settings.defaultLocation} />
            <Link href={accountHref} className="grid size-11 place-items-center rounded-full text-ink-900 hover:bg-mint-50 sm:hidden" aria-label={user ? d.header.myAccount : d.header.login}>
              <User className="size-5" />
            </Link>
            <Link
              href="/cart"
              className="relative grid size-11 place-items-center rounded-full bg-mint-50 text-brand-700 transition hover:bg-brand-100"
              aria-label={d.header.cartLabel(count)}
            >
              <ShoppingBasket className="size-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-tomato-500 px-1 text-[11px] font-bold leading-5 text-white">
                  {count > 99 ? "99+" : i.num(count)}
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
      <nav aria-label={d.header.menu} className="hidden border-b border-line bg-white lg:block">
        <div className="container-page flex h-14 items-center gap-6">
          <CategoryMenu categories={topCats.map((c) => ({ href: `/category/${c.slug}`, label: i.name(c), image: c.image }))} />
          <NavLinks items={nav} />
        </div>
      </nav>
    </header>
  );
}
