// One-off generator for static content pages (kept for reference). Content is a starting draft —
// the store owner must review policy text with a legal advisor before launch.
import { mkdirSync, writeFileSync } from "node:fs";

const pages = {
  about: {
    title: "About Us",
    intro: "We started with a simple idea: everyone deserves fresh, honest food at fair prices.",
    body: `<h2>Our story</h2>
<p>{s.storeName} connects local farms and trusted suppliers with households across {s.defaultLocation}. Every morning our team checks produce for freshness, ripeness and quality before it is packed for delivery.</p>
<h2>What we promise</h2>
<ul><li>Fresh produce, quality-checked daily</li><li>Clear prices per kg, piece or bunch — no surprises</li><li>On-time delivery in your chosen slot</li><li>Easy returns at the doorstep if something isn’t right</li></ul>
<h2>Working with farmers</h2>
<p>We buy directly from growers wherever we can, so more of what you pay reaches the people who grow your food.</p>`,
  },
  faq: {
    title: "Frequently Asked Questions",
    intro: "Quick answers about ordering, delivery and payments.",
    body: `{FAQS.map((f) => (
  <details key={f.q} className="rounded-2xl border border-line p-5 [&[open]>summary]:text-brand-700">
    <summary className="cursor-pointer font-semibold">{f.q}</summary>
    <p className="mt-2">{f.a}</p>
  </details>
))}`,
    pre: `const FAQS = [
  { q: "Where do you deliver?", a: "We deliver to the areas listed at checkout. Choose your area from “Deliver to” in the header to see fees and delivery times." },
  { q: "How much is delivery?", a: "Each delivery area has its own fee, and delivery is free once your order passes the free-delivery threshold shown in your cart." },
  { q: "Which payment methods do you accept?", a: "Cash on delivery is available on every order. Online payment appears at checkout when it is enabled for your store." },
  { q: "Can I cancel my order?", a: "Yes — you can cancel from My Orders while the order is pending or confirmed. Once it is being packed, please contact support." },
  { q: "What if an item isn’t fresh?", a: "Check your order at the door. If anything isn’t right, hand it back to the rider or contact us within 24 hours for a replacement or refund." },
  { q: "Why does the weight sometimes vary slightly?", a: "Fresh produce varies naturally. We always round in your favour and charge the price shown at checkout." },
];`,
  },
  "privacy-policy": {
    title: "Privacy Policy",
    updated: true,
    body: `<p>This policy explains what personal information {s.storeName} collects and how we use it.</p>
<h2>Information we collect</h2>
<ul><li>Account details: name, email, phone number and password (stored only as a secure hash)</li><li>Delivery addresses you save or enter at checkout</li><li>Order history and payment status (we never store card numbers)</li><li>Basic technical data such as IP address for security and fraud prevention</li></ul>
<h2>How we use it</h2>
<ul><li>To process and deliver your orders</li><li>To contact you about your orders</li><li>To protect accounts and prevent abuse</li><li>To send offers only if you subscribe to our newsletter</li></ul>
<h2>Sharing</h2>
<p>We share data only with service providers needed to run the store (hosting, payment gateway, email delivery) and when required by law. We never sell your data.</p>
<h2>Your choices</h2>
<p>You can update your profile and addresses in your account, unsubscribe from emails at any time, and ask us to delete your account by contacting support.</p>`,
  },
  terms: {
    title: "Terms & Conditions",
    updated: true,
    body: `<p>By using {s.storeName} you agree to these terms.</p>
<h2>Orders</h2>
<p>All orders are subject to availability. Prices and stock are confirmed when you place your order. We may cancel an order if an item becomes unavailable, and you will not be charged for cancelled items.</p>
<h2>Pricing</h2>
<p>Prices include applicable taxes unless stated. Delivery fees are shown before you confirm your order.</p>
<h2>Accounts</h2>
<p>You are responsible for keeping your password confidential. We may suspend accounts that misuse the service.</p>
<h2>Liability</h2>
<p>We are not liable for delays caused by events outside our control such as severe weather or road closures.</p>`,
  },
  "refund-policy": {
    title: "Refund & Return Policy",
    updated: true,
    body: `<h2>Fresh produce</h2>
<p>Please check your items when they arrive. If anything is damaged, spoiled or incorrect, you can return it to the delivery rider on the spot, or contact us within 24 hours with a photo.</p>
<h2>Packaged groceries</h2>
<p>Unopened packaged items can be returned within 3 days of delivery.</p>
<h2>How refunds work</h2>
<ul><li>Cash on delivery: we refund the amount for returned items at the door or credit it to your next order.</li><li>Online payments: refunds go back to the original payment method within 5–7 business days.</li></ul>
<h2>Cancelled orders</h2>
<p>If you cancel an order you already paid online, our team will contact you to arrange your refund.</p>`,
  },
};

for (const [slug, p] of Object.entries(pages)) {
  const dir = `src/app/(store)/${slug}`;
  mkdirSync(dir, { recursive: true });
  const name = slug.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
  writeFileSync(
    `${dir}/page.tsx`,
    `import type { Metadata } from "next";
import { ContentPage } from "@/components/store/ContentPage";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: ${JSON.stringify(p.title)}, alternates: { canonical: "/${slug}" } };
${p.pre ? "\n" + p.pre + "\n" : ""}
export default async function ${name}Page() {
  const s = await getSettings();
  return (
    <ContentPage title={${JSON.stringify(p.title)}}${p.intro ? ` intro={${JSON.stringify(p.intro)}}` : ""}${p.updated ? ` updated="26 November 2026"` : ""}>
      ${p.body.replace(/\{s\.(\w+)\}/g, "{s.$1}").replace(/class=/g, "className=")}
    </ContentPage>
  );
}
`,
  );
}
console.log("content pages written");
