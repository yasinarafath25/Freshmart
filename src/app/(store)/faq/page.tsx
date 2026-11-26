import type { Metadata } from "next";
import { ContentPage } from "@/components/store/ContentPage";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getI18n();
  return { title: lang === "bn" ? "সাধারণ জিজ্ঞাসা" : "Frequently Asked Questions", alternates: { canonical: "/faq" } };
}

const FAQS = {
  en: [
    { q: "Where do you deliver?", a: "We deliver to the areas listed at checkout. Choose your area from “Deliver to” in the header to see fees and delivery times." },
    { q: "How much is delivery?", a: "Each delivery area has its own fee, and delivery is free once your order passes the free-delivery threshold shown in your cart." },
    { q: "Which payment methods do you accept?", a: "Cash on delivery is available on every order. Online payment appears at checkout when it is enabled for the store." },
    { q: "Can I cancel my order?", a: "Yes — you can cancel from My Orders while the order is pending or confirmed. Once it is being packed, please contact support." },
    { q: "What if an item isn’t fresh?", a: "Check your order at the door. If anything isn’t right, hand it back to the rider or contact us within 24 hours for a replacement or refund." },
    { q: "Why does the weight sometimes vary slightly?", a: "Fresh produce varies naturally. We always round in your favour and charge the price shown at checkout." },
    { q: "Can I switch the website language?", a: "Yes. Use the EN / বাং switch at the top of any page. Your choice is remembered on this device." },
  ],
  bn: [
    { q: "আপনারা কোথায় ডেলিভারি দেন?", a: "চেকআউটে দেখানো এলাকাগুলোতে আমরা ডেলিভারি দিই। হেডারের “ডেলিভারি এলাকা” থেকে আপনার এলাকা বাছাই করলে চার্জ ও সময় দেখতে পাবেন।" },
    { q: "ডেলিভারি চার্জ কত?", a: "প্রতিটি এলাকার আলাদা চার্জ আছে। কার্টে দেখানো নির্দিষ্ট পরিমাণের বেশি কেনাকাটা করলে ডেলিভারি ফ্রি।" },
    { q: "কোন কোন পদ্ধতিতে পেমেন্ট করা যায়?", a: "সব অর্ডারে ক্যাশ অন ডেলিভারি আছে। দোকানে অনলাইন পেমেন্ট চালু থাকলে চেকআউটে সেটিও দেখাবে।" },
    { q: "অর্ডার কি বাতিল করা যায়?", a: "হ্যাঁ — অর্ডার “অপেক্ষমাণ” বা “নিশ্চিত হয়েছে” অবস্থায় থাকলে “আমার অর্ডার” থেকে বাতিল করতে পারবেন। প্যাক করা শুরু হয়ে গেলে সহায়তায় যোগাযোগ করুন।" },
    { q: "পণ্য তাজা না হলে কী করব?", a: "দরজাতেই পণ্য দেখে নিন। কিছু ঠিক না থাকলে ডেলিভারি কর্মীকে ফেরত দিন, অথবা ২৪ ঘণ্টার মধ্যে আমাদের জানান — আমরা বদলে দেব বা টাকা ফেরত দেব।" },
    { q: "ওজন মাঝে মাঝে সামান্য কমবেশি হয় কেন?", a: "তাজা ফসলের ওজন স্বাভাবিকভাবেই একটু কমবেশি হয়। আমরা সবসময় আপনার পক্ষে হিসাব করি আর চেকআউটে দেখানো দামই নিই।" },
    { q: "ওয়েবসাইটের ভাষা কি বদলানো যায়?", a: "হ্যাঁ। যেকোনো পেজের উপরের EN / বাং বাটন দিয়ে ভাষা বদলান। আপনার পছন্দ এই ডিভাইসে মনে রাখা হবে।" },
  ],
};

export default async function FaqPage() {
  const i = await getI18n();
  const bn = i.lang === "bn";
  return (
    <ContentPage title={bn ? "সাধারণ জিজ্ঞাসা" : "Frequently Asked Questions"} intro={bn ? "অর্ডার, ডেলিভারি আর পেমেন্ট নিয়ে দ্রুত উত্তর।" : "Quick answers about ordering, delivery and payments."}>
      {FAQS[i.lang].map((f) => (
        <details key={f.q} className="rounded-2xl border border-line p-5 [&[open]>summary]:text-brand-700">
          <summary className="cursor-pointer font-semibold">{f.q}</summary>
          <p className="mt-2">{f.a}</p>
        </details>
      ))}
    </ContentPage>
  );
}
