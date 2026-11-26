import type { Metadata } from "next";
import { ContentPage } from "@/components/store/ContentPage";
import { getSettings } from "@/lib/services/settings";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getI18n();
  return { title: lang === "bn" ? "শর্তাবলি" : "Terms & Conditions", alternates: { canonical: "/terms" } };
}

export default async function TermsPage() {
  const [s, i] = await Promise.all([getSettings(), getI18n()]);
  if (i.lang === "bn")
    return (
      <ContentPage title="শর্তাবলি" updated={i.date("2026-11-27", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}>
        <p>{s.storeName} ব্যবহার করে আপনি এই শর্তাবলিতে সম্মতি দিচ্ছেন।</p>
        <h2>অর্ডার</h2>
        <p>সব অর্ডার পণ্যের প্রাপ্যতার উপর নির্ভরশীল। অর্ডার করার সময় দাম ও স্টক নিশ্চিত করা হয়। কোনো পণ্য পাওয়া না গেলে আমরা অর্ডার বাতিল করতে পারি, বাতিল পণ্যের জন্য আপনার কাছ থেকে টাকা নেওয়া হবে না।</p>
        <h2>দাম</h2>
        <p>উল্লেখ না থাকলে দামে প্রযোজ্য কর অন্তর্ভুক্ত। অর্ডার নিশ্চিত করার আগেই ডেলিভারি চার্জ দেখানো হয়।</p>
        <h2>অ্যাকাউন্ট</h2>
        <p>পাসওয়ার্ড গোপন রাখার দায়িত্ব আপনার। সেবার অপব্যবহার করলে আমরা অ্যাকাউন্ট স্থগিত করতে পারি।</p>
        <h2>দায়</h2>
        <p>খারাপ আবহাওয়া বা রাস্তা বন্ধের মতো আমাদের নিয়ন্ত্রণের বাইরের কারণে দেরি হলে আমরা দায়ী নই।</p>
      </ContentPage>
    );
  return (
    <ContentPage title="Terms & Conditions" updated={i.date("2026-11-27", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}>
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
