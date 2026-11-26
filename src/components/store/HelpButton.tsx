"use client";

import { useState } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";

/** Floating support button: call or WhatsApp the store. Only rendered when a support phone is configured. */
export function HelpButton({ phone }: { phone: string }) {
  const { d } = useI18n();
  const [open, setOpen] = useState(false);
  const digits = phone.replace(/[^\d+]/g, "");
  const wa = digits.replace(/^\+/, "");
  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 lg:bottom-6">
      {open && (
        <div className="animate-fade-in flex flex-col gap-2">
          <a href={`tel:${digits}`} className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold shadow-pop hover:text-brand-700">
            <Phone className="size-4 text-brand-700" aria-hidden /> {d.help.call}
          </a>
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold shadow-pop hover:text-brand-700">
            <MessageCircle className="size-4 text-leaf-500" aria-hidden /> {d.help.whatsapp}
          </a>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? d.common.close : d.footer.help}
        className="grid size-13 place-items-center rounded-full bg-leaf-500 text-white shadow-pop transition hover:bg-brand-700"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
}
