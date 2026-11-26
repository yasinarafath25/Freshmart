import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Inter, Poppins } from "next/font/google";
import "./globals.css";
import { getLang } from "@/lib/i18n/server";
import { DICTS } from "@/lib/i18n/dict";
import { I18nProvider } from "@/lib/i18n/client";
import { getSettings } from "@/lib/services/settings";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-poppins", display: "swap" });
// Bengali glyphs: Inter/Poppins have none, so the browser falls back to Hind Siliguri for Bangla text.
const bangla = Hind_Siliguri({ subsets: ["bengali", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-bangla", display: "swap" });

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const bn = lang === "bn";
  return {
    metadataBase: new URL(appUrl),
    title: {
      default: bn ? "FreshMart — তাজা ফল, সবজি ও মুদি পণ্য হোম ডেলিভারি" : "FreshMart — Fresh Fruits, Vegetables & Groceries Delivered",
      template: "%s | FreshMart",
    },
    description: bn
      ? "খামারের তাজা ফল, সবজি, মুদি পণ্য, মসলা ও চাল-ডাল অনলাইনে অর্ডার করুন। একই দিনে হোম ডেলিভারি, ক্যাশ অন ডেলিভারি আর ১০০% তাজা থাকার নিশ্চয়তা।"
      : "Order farm-fresh fruits, vegetables, groceries, spices and grains online. Same-day home delivery, cash on delivery and a 100% freshness guarantee.",
    openGraph: { type: "website", siteName: "FreshMart", locale: bn ? "bn_BD" : "en_US", images: ["/images/photos/banner-vegetable-basket.jpg"] },
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = { themeColor: "#0B4D2C", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, settings] = await Promise.all([getLang(), getSettings()]);
  return (
    <html lang={lang} className={`${inter.variable} ${poppins.variable} ${bangla.variable}`}>
      <body className={lang === "bn" ? "lang-bn" : undefined}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-pop">
          {DICTS[lang].skip}
        </a>
        <I18nProvider lang={lang} currency={settings.currencySymbol}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
