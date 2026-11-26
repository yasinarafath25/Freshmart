import type { Metadata } from "next";
import { ContentPage } from "@/components/store/ContentPage";
import { getSettings } from "@/lib/services/settings";
import { getI18n } from "@/lib/i18n/server";
import { PHOTO_CREDITS } from "@/lib/photo-credits";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getI18n();
  return { title: lang === "bn" ? "আমাদের কথা" : "About Us", alternates: { canonical: "/about" } };
}

export default async function AboutPage() {
  const [s, i] = await Promise.all([getSettings(), getI18n()]);
  const bn = i.lang === "bn";
  return (
    <ContentPage
      title={bn ? "আমাদের কথা" : "About Us"}
      intro={bn ? "আমাদের শুরু একটি সহজ ভাবনা থেকে: সবাই ন্যায্য দামে তাজা, খাঁটি খাবার পাওয়ার যোগ্য।" : "We started with a simple idea: everyone deserves fresh, honest food at fair prices."}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/photos/banner-vegetable-market.jpg" alt="" width={960} height={720} loading="lazy" className="aspect-[16/9] w-full rounded-2xl object-cover" />
      {bn ? (
        <>
          <h2>আমাদের গল্প</h2>
          <p>{s.storeName} স্থানীয় খামার ও বিশ্বস্ত সরবরাহকারীদের সাথে {s.defaultLocation === "Karimganj" ? "করিমগঞ্জ" : s.defaultLocation} এলাকার পরিবারগুলোকে যুক্ত করে। প্রতিদিন সকালে আমাদের টিম প্রতিটি পণ্যের তাজাভাব, পাকা অবস্থা ও মান যাচাই করে তারপর ডেলিভারির জন্য প্যাক করে।</p>
          <h2>আমাদের প্রতিশ্রুতি</h2>
          <ul><li>প্রতিদিন মান যাচাই করা তাজা পণ্য</li><li>কেজি, পিস বা আঁটি অনুযায়ী পরিষ্কার দাম — কোনো লুকানো খরচ নেই</li><li>আপনার বেছে নেওয়া সময়ে ঠিকঠাক ডেলিভারি</li><li>কিছু ঠিক না থাকলে দরজাতেই সহজে ফেরত</li></ul>
          <h2>কৃষকদের পাশে</h2>
          <p>যেখানে সম্ভব আমরা সরাসরি কৃষকের কাছ থেকে কিনি, যাতে আপনার দেওয়া টাকার বড় অংশ পৌঁছায় যারা ফসল ফলান তাদের কাছে।</p>
        </>
      ) : (
        <>
          <h2>Our story</h2>
          <p>{s.storeName} connects local farms and trusted suppliers with households across {s.defaultLocation}. Every morning our team checks produce for freshness, ripeness and quality before it is packed for delivery.</p>
          <h2>What we promise</h2>
          <ul><li>Fresh produce, quality-checked daily</li><li>Clear prices per kg, piece or bunch — no surprises</li><li>On-time delivery in your chosen slot</li><li>Easy returns at the doorstep if something isn’t right</li></ul>
          <h2>Working with farmers</h2>
          <p>We buy directly from growers wherever we can, so more of what you pay reaches the people who grow your food.</p>
        </>
      )}
      <h2 id="photo-credits">{bn ? "ছবির কৃতজ্ঞতা" : "Photo credits"}</h2>
      <p>{bn ? "এই সাইটের পণ্য ও ব্যানারের ছবি তুলেছেন নিচের ফটোগ্রাফার ও স্টুডিওরা।" : "Product and banner photography on this site is by the following photographers and studios."}</p>
      <ul className="columns-1 text-sm sm:columns-2">
        {PHOTO_CREDITS.map((c) => (
          <li key={c.credit} className="break-inside-avoid">
            <span className="font-medium text-ink-900">{c.credit}</span> — {c.subjects.join(", ")}
          </li>
        ))}
      </ul>
    </ContentPage>
  );
}
