import type { Metadata } from "next";
import { ContentPage } from "@/components/store/ContentPage";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getI18n();
  return { title: lang === "bn" ? "রিফান্ড ও ফেরত নীতি" : "Refund & Return Policy", alternates: { canonical: "/refund-policy" } };
}

export default async function RefundPolicyPage() {
  const i = await getI18n();
  if (i.lang === "bn")
    return (
      <ContentPage title="রিফান্ড ও ফেরত নীতি" updated={i.date("2026-11-27", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}>
        <h2>তাজা পণ্য</h2>
        <p>পণ্য হাতে পেয়েই দেখে নিন। কোনো পণ্য নষ্ট, পচা বা ভুল হলে ডেলিভারি কর্মীকে তখনই ফেরত দিতে পারেন, অথবা ২৪ ঘণ্টার মধ্যে ছবি সহ আমাদের জানান।</p>
        <h2>প্যাকেটজাত মুদি পণ্য</h2>
        <p>না খোলা প্যাকেটজাত পণ্য ডেলিভারির ৩ দিনের মধ্যে ফেরত দেওয়া যাবে।</p>
        <h2>টাকা যেভাবে ফেরত দেওয়া হয়</h2>
        <ul><li>ক্যাশ অন ডেলিভারি: ফেরত দেওয়া পণ্যের টাকা দরজাতেই ফেরত দেওয়া হয়, অথবা পরের অর্ডারে সমন্বয় করা হয়।</li><li>অনলাইন পেমেন্ট: ৫–৭ কর্মদিবসের মধ্যে একই পেমেন্ট মাধ্যমে টাকা ফেরত যায়।</li></ul>
        <h2>বাতিল অর্ডার</h2>
        <p>অনলাইনে টাকা দেওয়া অর্ডার বাতিল করলে রিফান্ডের জন্য আমাদের টিম আপনার সাথে যোগাযোগ করবে।</p>
      </ContentPage>
    );
  return (
    <ContentPage title="Refund & Return Policy" updated={i.date("2026-11-27", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}>
      <h2>Fresh produce</h2>
      <p>Please check your items when they arrive. If anything is damaged, spoiled or incorrect, you can return it to the delivery rider on the spot, or contact us within 24 hours with a photo.</p>
      <h2>Packaged groceries</h2>
      <p>Unopened packaged items can be returned within 3 days of delivery.</p>
      <h2>How refunds work</h2>
      <ul><li>Cash on delivery: we refund the amount for returned items at the door or credit it to your next order.</li><li>Online payments: refunds go back to the original payment method within 5–7 business days.</li></ul>
      <h2>Cancelled orders</h2>
      <p>If you cancel an order you already paid online, our team will contact you to arrange your refund.</p>
    </ContentPage>
  );
}
