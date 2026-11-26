import type { Metadata } from "next";
import { ContentPage } from "@/components/store/ContentPage";
import { getSettings } from "@/lib/services/settings";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getI18n();
  return { title: lang === "bn" ? "গোপনীয়তা নীতি" : "Privacy Policy", alternates: { canonical: "/privacy-policy" } };
}

export default async function PrivacyPolicyPage() {
  const [s, i] = await Promise.all([getSettings(), getI18n()]);
  if (i.lang === "bn")
    return (
      <ContentPage title="গোপনীয়তা নীতি" updated={i.date("2026-11-27", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}>
        <p>{s.storeName} কী কী ব্যক্তিগত তথ্য সংগ্রহ করে আর কীভাবে ব্যবহার করে, এই নীতিতে তা বলা হয়েছে।</p>
        <h2>আমরা যে তথ্য সংগ্রহ করি</h2>
        <ul><li>অ্যাকাউন্টের তথ্য: নাম, ইমেইল, ফোন নম্বর ও পাসওয়ার্ড (শুধু সুরক্ষিত হ্যাশ হিসেবে)</li><li>আপনার সংরক্ষিত বা চেকআউটে দেওয়া ডেলিভারির ঠিকানা</li><li>অর্ডারের ইতিহাস ও পেমেন্টের অবস্থা (আমরা কখনো কার্ড নম্বর রাখি না)</li><li>নিরাপত্তা ও প্রতারণা রোধের জন্য IP ঠিকানার মতো প্রাথমিক কারিগরি তথ্য</li></ul>
        <h2>যেভাবে ব্যবহার করি</h2>
        <ul><li>অর্ডার প্রক্রিয়া ও ডেলিভারির জন্য</li><li>অর্ডার সংক্রান্ত যোগাযোগের জন্য</li><li>অ্যাকাউন্ট সুরক্ষা ও অপব্যবহার রোধের জন্য</li><li>নিউজলেটারে সাবস্ক্রাইব করলে শুধু তখনই অফার পাঠাতে</li></ul>
        <h2>তথ্য শেয়ার</h2>
        <p>দোকান চালাতে যাদের প্রয়োজন (হোস্টিং, পেমেন্ট গেটওয়ে, ইমেইল সেবা) এবং আইনগত বাধ্যবাধকতা ছাড়া আমরা কারো সাথে তথ্য শেয়ার করি না। আমরা কখনো আপনার তথ্য বিক্রি করি না।</p>
        <h2>আপনার পছন্দ</h2>
        <p>অ্যাকাউন্ট থেকে প্রোফাইল ও ঠিকানা বদলাতে পারবেন, যেকোনো সময় ইমেইল বন্ধ করতে পারবেন, আর সহায়তায় যোগাযোগ করে অ্যাকাউন্ট মুছে ফেলার অনুরোধ করতে পারবেন।</p>
      </ContentPage>
    );
  return (
    <ContentPage title="Privacy Policy" updated={i.date("2026-11-27", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}>
      <p>This policy explains what personal information {s.storeName} collects and how we use it.</p>
      <h2>Information we collect</h2>
      <ul><li>Account details: name, email, phone number and password (stored only as a secure hash)</li><li>Delivery addresses you save or enter at checkout</li><li>Order history and payment status (we never store card numbers)</li><li>Basic technical data such as IP address for security and fraud prevention</li></ul>
      <h2>How we use it</h2>
      <ul><li>To process and deliver your orders</li><li>To contact you about your orders</li><li>To protect accounts and prevent abuse</li><li>To send offers only if you subscribe to our newsletter</li></ul>
      <h2>Sharing</h2>
      <p>We share data only with service providers needed to run the store (hosting, payment gateway, email delivery) and when required by law. We never sell your data.</p>
      <h2>Your choices</h2>
      <p>You can update your profile and addresses in your account, unsubscribe from emails at any time, and ask us to delete your account by contacting support.</p>
    </ContentPage>
  );
}
