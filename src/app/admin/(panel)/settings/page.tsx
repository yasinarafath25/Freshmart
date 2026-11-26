import { requireStaffPage } from "@/lib/auth/guards";
import { getSettings } from "@/lib/services/settings";
import { NoAccess, PageHeader } from "@/components/admin/ui";
import { AdminForm } from "@/components/admin/AdminForm";
import { AField, ATextarea } from "@/components/admin/fields";
import { Card, Checkbox } from "@/components/ui";
import { saveSettingsAction } from "@/app/admin/actions";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { allowed } = await requireStaffPage("settings:write");
  if (!allowed) return <NoAccess />;
  const s = await getSettings();
  const m = (n: number) => String(n / 100);
  return (
    <>
      <PageHeader title="Store settings" description="Changes apply to the storefront immediately." />
      <AdminForm action={saveSettingsAction} submitLabel="Save settings" className="max-w-4xl">
        <Card className="grid gap-4 p-6 sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">Brand</h2>
          <AField name="storeName" label="Store name" defaultValue={s.storeName} required />
          <AField name="tagline" label="Tagline (English)" defaultValue={s.tagline} />
          <AField name="taglineBn" label="ট্যাগলাইন (বাংলা)" lang="bn" defaultValue={s.taglineBn} />
          <AField name="currencySymbol" label="Currency symbol" defaultValue={s.currencySymbol} required hint="e.g. ৳ or ₹" />
          <AField name="currencyCode" label="Currency code (ISO)" defaultValue={s.currencyCode} required maxLength={3} hint="e.g. BDT or INR — sent to the payment gateway" />
          <ATextarea name="announcements" label="Announcement bar — English (one per line, max 3)" defaultValue={s.announcements.join("\n")} className="sm:col-span-2" />
          <ATextarea name="announcementsBn" label="ঘোষণা বার — বাংলা (প্রতি লাইনে একটি, সর্বোচ্চ ৩টি)" lang="bn" defaultValue={s.announcementsBn.join("\n")} className="sm:col-span-2" />
        </Card>
        <Card className="grid gap-4 p-6 sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">Contact</h2>
          <AField name="supportPhone" label="Support phone" defaultValue={s.supportPhone} />
          <AField name="supportEmail" label="Support email" type="email" defaultValue={s.supportEmail} />
          <AField name="address" label="Store address" defaultValue={s.address} className="sm:col-span-2" />
          <AField name="defaultLocation" label="Default delivery location label" defaultValue={s.defaultLocation} />
          <AField name="timeZone" label="Store time zone" defaultValue={s.timeZone} hint="IANA name, e.g. Asia/Kolkata or Asia/Dhaka — used for delivery dates" />
          <AField name="socialFacebook" label="Facebook URL" defaultValue={s.socialFacebook} />
          <AField name="socialInstagram" label="Instagram URL" defaultValue={s.socialInstagram} />
        </Card>
        <Card className="grid gap-4 p-6 sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">Orders &amp; delivery</h2>
          <AField name="minOrder" label={`Minimum order (${s.currencySymbol})`} type="number" min={0} step="0.01" defaultValue={m(s.minOrder)} />
          <AField name="freeDeliveryThreshold" label={`Default free-delivery threshold (${s.currencySymbol})`} type="number" min={0} step="0.01" defaultValue={m(s.freeDeliveryThreshold)} hint="Used when a delivery area has no own threshold" />
          <AField name="lowStockThreshold" label="Low-stock alert at (units)" type="number" min={0} defaultValue={String(s.lowStockThreshold)} />
          <div className="flex items-end pb-2"><Checkbox name="codEnabled" label="Accept cash on delivery" defaultChecked={s.codEnabled} /></div>
          <ATextarea name="deliverySlots" label="Delivery time slots (one per line)" defaultValue={s.deliverySlots.join("\n")} className="sm:col-span-2" />
        </Card>
      </AdminForm>
    </>
  );
}
