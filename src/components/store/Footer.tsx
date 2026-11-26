import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/lib/services/settings";
import { listCategories } from "@/lib/services/catalog";
import { getI18n } from "@/lib/i18n/server";
import { Logo } from "./Logo";
import { LangSwitch } from "./LangSwitch";

export async function Footer() {
  const [s, cats, i] = await Promise.all([getSettings(), listCategories(), getI18n()]);
  const f = i.d.footer;
  const year = i.num(String(new Date().getFullYear()));
  const cols = [
    { title: f.shop, links: [{ href: "/shop", label: f.allProducts }, ...cats.filter((c) => !c.parentId).slice(0, 5).map((c) => ({ href: `/category/${c.slug}`, label: i.name(c) })), { href: "/offers", label: i.d.nav.offers }] },
    { title: f.account, links: [{ href: "/account", label: f.myAccount }, { href: "/account/orders", label: f.trackOrders }, { href: "/account/wishlist", label: f.wishlist }, { href: "/cart", label: f.cart }] },
    { title: f.help, links: [{ href: "/faq", label: f.faq }, { href: "/contact", label: f.contact }, { href: "/refund-policy", label: f.refund }, { href: "/terms", label: f.terms }, { href: "/privacy-policy", label: f.privacy }, { href: "/about", label: f.aboutUs }] },
  ];
  return (
    <footer className="mt-8 bg-brand-900 pb-20 text-white/80 lg:pb-0">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo name={s.storeName} tagline={i.lang === "bn" ? s.taglineBn : s.tagline} light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">{f.about}</p>
          <ul className="mt-5 space-y-2 text-sm">
            {s.address && (
              <li className="flex gap-2">
                <MapPin className="size-4 shrink-0 text-lime-400" aria-hidden /> {s.address}
              </li>
            )}
            {s.supportPhone && (
              <li className="flex gap-2">
                <Phone className="size-4 shrink-0 text-lime-400" aria-hidden />
                <a href={`tel:${s.supportPhone.replace(/\s/g, "")}`} className="hover:text-white">
                  {s.supportPhone}
                </a>
              </li>
            )}
            {s.supportEmail && (
              <li className="flex gap-2">
                <Mail className="size-4 shrink-0 text-lime-400" aria-hidden />
                <a href={`mailto:${s.supportEmail}`} className="hover:text-white">
                  {s.supportEmail}
                </a>
              </li>
            )}
          </ul>
          <LangSwitch variant="dark" className="mt-6" />
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="font-display text-base font-semibold text-white">{c.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition hover:text-lime-400">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs sm:flex-row">
          <p>
            © {year} {s.storeName}. {f.rights}
          </p>
          <p className="flex items-center gap-2">
            {f.weAccept} <span className="rounded bg-white/10 px-2 py-0.5 font-semibold text-white">{f.cod}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
