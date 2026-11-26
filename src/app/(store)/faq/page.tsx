import type { Metadata } from "next";
import { ContentPage } from "@/components/store/ContentPage";

export const metadata: Metadata = { title: "Frequently Asked Questions", alternates: { canonical: "/faq" } };

const FAQS = [
  { q: "Where do you deliver?", a: "We deliver to the areas listed at checkout. Choose your area from “Deliver to” in the header to see fees and delivery times." },
  { q: "How much is delivery?", a: "Each delivery area has its own fee, and delivery is free once your order passes the free-delivery threshold shown in your cart." },
  { q: "Which payment methods do you accept?", a: "Cash on delivery is available on every order. Online payment appears at checkout when it is enabled for your store." },
  { q: "Can I cancel my order?", a: "Yes — you can cancel from My Orders while the order is pending or confirmed. Once it is being packed, please contact support." },
  { q: "What if an item isn’t fresh?", a: "Check your order at the door. If anything isn’t right, hand it back to the rider or contact us within 24 hours for a replacement or refund." },
  { q: "Why does the weight sometimes vary slightly?", a: "Fresh produce varies naturally. We always round in your favour and charge the price shown at checkout." },
];

export default function FaqPage() {
  return (
    <ContentPage title={"Frequently Asked Questions"} intro={"Quick answers about ordering, delivery and payments."}>
      {FAQS.map((f) => (
  <details key={f.q} className="rounded-2xl border border-line p-5 [&[open]>summary]:text-brand-700">
    <summary className="cursor-pointer font-semibold">{f.q}</summary>
    <p className="mt-2">{f.a}</p>
  </details>
))}
    </ContentPage>
  );
}
