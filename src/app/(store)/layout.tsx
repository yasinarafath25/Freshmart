import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { BottomNav } from "@/components/store/BottomNav";
import { Toaster } from "@/components/store/Toaster";
import { HelpButton } from "@/components/store/HelpButton";
import { getCartCount } from "@/lib/services/cart";
import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/services/settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [count, user, settings] = await Promise.all([getCartCount(), getCurrentUser(), getSettings()]);
  const accountHref = user ? (user.role === "staff" ? "/admin/dashboard" : "/account") : "/login";
  return (
    <>
      <Header />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer />
      <BottomNav cartCount={count} accountHref={accountHref} />
      {settings.supportPhone && <HelpButton phone={settings.supportPhone} />}
      <Toaster />
    </>
  );
}
