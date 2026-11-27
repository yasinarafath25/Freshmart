import { requireStaffPage } from "@/lib/auth/guards";
import { getSettings } from "@/lib/services/settings";
import { NoAccess, PageHeader } from "@/components/admin/ui";
import { AdminForm } from "@/components/admin/AdminForm";
import { AField, ATextarea } from "@/components/admin/fields";
import { Card, Checkbox } from "@/components/ui";
import { saveSettingsAction } from "@/app/admin/actions";
import { TelegramCard } from "@/components/admin/TelegramCard";
import { telegramStatus } from "@/lib/services/telegram";
import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { allowed } = await requireStaffPage("settings:write");
  if (!allowed) return <NoAccess />;
  const [s, { t }] = await Promise.all([getSettings(), getI18n()]);
  const m = (n: number) => String(n / 100);
  return (
    <>
      <PageHeader title={t("Store settings", "স্টোর সেটিংস")} description={t("Changes show in your store right away.", "পরিবর্তন সাথে সাথে আপনার স্টোরে দেখাবে।")} />
      <div className="mb-6"><TelegramCard {...(({ hasToken, chatCount }) => ({ hasToken, chatCount }))(telegramStatus())} /></div>
      <AdminForm action={saveSettingsAction} submitLabel={t("Save settings", "সেটিংস সংরক্ষণ করুন")} className="max-w-4xl">
        <Card className="grid gap-4 p-6 sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">{t("Shop name & look", "দোকানের নাম ও পরিচিতি")}</h2>
          <AField name="storeName" label={t("Store name", "দোকানের নাম")} defaultValue={s.storeName} required />
          <AField name="tagline" label={t("Tagline (English)", "ট্যাগলাইন (ইংরেজি)")} defaultValue={s.tagline} />
          <AField name="taglineBn" label="ট্যাগলাইন (বাংলা)" lang="bn" defaultValue={s.taglineBn} />
          <AField name="currencySymbol" label={t("Currency symbol", "মুদ্রার চিহ্ন")} defaultValue={s.currencySymbol} required hint={t("e.g. ৳ or ₹", "যেমন ৳")} />
          <AField name="currencyCode" label={t("Currency code (ISO)", "মুদ্রার কোড")} defaultValue={s.currencyCode} required maxLength={3} hint={t("e.g. BDT or INR — sent to the payment gateway", "যেমন BDT — পেমেন্ট গেটওয়েতে পাঠানো হয়")} />
          <ATextarea name="announcements" label={t("Announcement bar — English (one per line, max 3)", "ঘোষণা বার — ইংরেজি (প্রতি লাইনে একটি, সর্বোচ্চ ৩টি)")} defaultValue={s.announcements.join("\n")} className="sm:col-span-2" />
          <ATextarea name="announcementsBn" label="ঘোষণা বার — বাংলা (প্রতি লাইনে একটি, সর্বোচ্চ ৩টি)" lang="bn" defaultValue={s.announcementsBn.join("\n")} className="sm:col-span-2" />
        </Card>
        <Card className="grid gap-4 p-6 sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">{t("Contact", "যোগাযোগ")}</h2>
          <AField name="supportPhone" label={t("Shop phone", "দোকানের ফোন")} defaultValue={s.supportPhone} />
          <AField name="supportEmail" label={t("Shop email", "দোকানের ইমেইল")} type="email" defaultValue={s.supportEmail} />
          <AField name="address" label={t("Shop address", "দোকানের ঠিকানা")} defaultValue={s.address} className="sm:col-span-2" />
          <AField name="defaultLocation" label={t("Default delivery location label", "ডিফল্ট ডেলিভারি লোকেশন")} defaultValue={s.defaultLocation} />
          <AField name="timeZone" label={t("Store time zone", "সময় অঞ্চল (টাইম জোন)")} defaultValue={s.timeZone} hint={t("e.g. Asia/Dhaka — used for delivery dates", "যেমন Asia/Dhaka — ডেলিভারির তারিখের জন্য লাগে")} />
          <AField name="socialFacebook" label={t("Facebook link", "ফেসবুক লিংক")} defaultValue={s.socialFacebook} />
          <AField name="socialInstagram" label={t("Instagram link", "ইনস্টাগ্রাম লিংক")} defaultValue={s.socialInstagram} />
        </Card>
        <Card className="grid gap-4 p-6 sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">{t("Orders & delivery", "অর্ডার ও ডেলিভারি")}</h2>
          <AField name="minOrder" label={t(`Minimum order (${s.currencySymbol})`, `সর্বনিম্ন অর্ডার (${s.currencySymbol})`)} type="number" min={0} step="0.01" defaultValue={m(s.minOrder)} />
          <AField name="freeDeliveryThreshold" label={t(`Free delivery above (${s.currencySymbol})`, `যত টাকার বেশি হলে ফ্রি ডেলিভারি (${s.currencySymbol})`)} type="number" min={0} step="0.01" defaultValue={m(s.freeDeliveryThreshold)} hint={t("Used when a delivery area has no own amount", "যে এলাকার নিজের সীমা নেই, সেখানে এটা লাগবে")} />
          <AField name="lowStockThreshold" label={t("Low-stock alert at (units)", "কত পিসের কম হলে “স্টক কম” দেখাবে")} type="number" min={0} defaultValue={String(s.lowStockThreshold)} />
          <div className="flex items-end pb-2"><Checkbox name="codEnabled" label={t("Accept cash on delivery", "ক্যাশ অন ডেলিভারি চালু")} defaultChecked={s.codEnabled} /></div>
          <ATextarea name="deliverySlots" label={t("Delivery time slots (one per line)", "ডেলিভারির সময় (প্রতি লাইনে একটি)")} defaultValue={s.deliverySlots.join("\n")} className="sm:col-span-2" />
        </Card>
      </AdminForm>
    </>
  );
}
