import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/lib/services/settings";
import { getI18n } from "@/lib/i18n/server";
import { ContactForm } from "@/components/store/ContactForm";
import { Card } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.contact.title, alternates: { canonical: "/contact" } };
}

export default async function ContactPage() {
  const [s, i] = await Promise.all([getSettings(), getI18n()]);
  const c = i.d.contact;
  const info = [
    s.supportPhone && { Icon: Phone, label: c.phoneLbl, value: s.supportPhone, href: `tel:${s.supportPhone.replace(/\s/g, "")}` },
    s.supportEmail && { Icon: Mail, label: c.emailLbl, value: s.supportEmail, href: `mailto:${s.supportEmail}` },
    s.address && { Icon: MapPin, label: c.addressLbl, value: s.address },
    { Icon: Clock, label: c.hours, value: c.hoursVal },
  ].filter(Boolean) as { Icon: typeof Phone; label: string; value: string; href?: string }[];
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">{c.title}</h1>
      <p className="mt-2 text-ink-600">{c.body}</p>
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
