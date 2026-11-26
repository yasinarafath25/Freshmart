import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-poppins", display: "swap" });

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "FreshMart — Fresh Fruits, Vegetables & Groceries Delivered", template: "%s | FreshMart" },
  description:
    "Order farm-fresh fruits, vegetables, groceries, spices and grains online. Same-day home delivery, cash on delivery and a 100% freshness guarantee.",
  openGraph: { type: "website", siteName: "FreshMart", images: ["/images/photos/banner-vegetable-basket.jpg"] },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#0B4D2C", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-pop">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
