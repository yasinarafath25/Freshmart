import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/lib/services/settings";
import { ContactForm } from "@/components/store/ContactForm";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Contact us", alternates: { canonical: "/contact" } };

export default async function ContactPage() {
  const s = await getSettings();
  const info = [
    s.supportPhone && { Icon: Phone, label: "Phone", value: s.supportPhone, href: `tel:${s.supportPhone.replace(/\s/g, "")}` },
    s.supportEmail && { Icon: Mail, label: "Email", value: s.supportEmail, href: `mailto:${s.supportEmail}` },
    s.address && { Icon: MapPin, label: "Address", value: s.address },
    { Icon: Clock, label: "Support hours", value: "Every day, 8 AM – 9 PM" },
  ].filter(Boolean) as { Icon: typeof Phone; label: string; value: string; href?: string }[];
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Contact us</h1>
      <p className="mt-2 text-ink-600">Questions about an order or our products? We’re happy to help.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <Card className="p-6 sm:p-8">
          <ContactForm />
        </Card>
        <div className="space-y-3">
          {info.map(({ Icon, label, value, href }) => (
            <div key={label} className="flex gap-4 rounded-2xl bg-mint-50 p-5">
              <Icon className="size-6 shrink-0 text-brand-700" aria-hidden />
              <div>
                <p className="text-sm text-ink-600">{label}</p>
                {href ? <a href={href} className="font-semibold hover:text-brand-700">{value}</a> : <p className="font-semibold">{value}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
