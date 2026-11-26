import type { Metadata } from "next";
import { ContentPage } from "@/components/store/ContentPage";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Terms & Conditions", alternates: { canonical: "/terms" } };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <ContentPage title={"Terms & Conditions"} updated="26 November 2026">
      <p>By using {s.storeName} you agree to these terms.</p>
<h2>Orders</h2>
<p>All orders are subject to availability. Prices and stock are confirmed when you place your order. We may cancel an order if an item becomes unavailable, and you will not be charged for cancelled items.</p>
<h2>Pricing</h2>
<p>Prices include applicable taxes unless stated. Delivery fees are shown before you confirm your order.</p>
<h2>Accounts</h2>
<p>You are responsible for keeping your password confidential. We may suspend accounts that misuse the service.</p>
<h2>Liability</h2>
<p>We are not liable for delays caused by events outside our control such as severe weather or road closures.</p>
    </ContentPage>
  );
}
