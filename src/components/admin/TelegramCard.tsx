"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, CircleAlert, Copy, Loader2, Search, Send } from "lucide-react";
import { findTelegramChatsAction, sendTelegramTestAction } from "@/app/admin/actions";
import { Alert, Badge, Button, Card } from "@/components/ui";
import { useI18n } from "@/lib/i18n/client";

export function TelegramCard({ hasToken, chatCount }: { hasToken: boolean; chatCount: number }) {
  const ready = hasToken && chatCount > 0;
  const { t, msg: tm, num } = useI18n();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [chats, setChats] = useState<{ id: string; name: string; type: string }[] | null>(null);

  return (
    <Card className="max-w-4xl space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{t("Telegram order alerts", "টেলিগ্রামে অর্ডারের খবর")}</h2>
          <p className="text-sm text-ink-600">{t("Get a Telegram message for every new order and every customer cancellation.", "প্রতিটি নতুন অর্ডার আর গ্রাহকের বাতিল করা অর্ডারের খবর টেলিগ্রামে পাবেন।")}</p>
        </div>
        {ready ? (
          <Badge tone="green"><CheckCircle2 className="size-3.5" aria-hidden /> {t(`Connected (${chatCount} chat${chatCount > 1 ? "s" : ""})`, `চালু আছে (${num(chatCount)}টি চ্যাট)`)}</Badge>
        ) : (
          <Badge tone="yellow"><CircleAlert className="size-3.5" aria-hidden /> {t("Not set up", "চালু হয়নি")}</Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={ready ? "primary" : "secondary"}
          disabled={pending || !hasToken}
          onClick={() => start(async () => { const r = await sendTelegramTestAction(); setMsg({ ok: !!r?.ok, text: r?.message ?? "" }); })}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />} {t("Send test message", "টেস্ট মেসেজ পাঠান")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending || !hasToken}
          onClick={() => start(async () => { const r = await findTelegramChatsAction(); setChats(r.chats ?? null); setMsg(r.message ? { ok: r.ok, text: r.message } : null); })}
        >
          <Search className="size-4" aria-hidden /> {t("Find my chat ID", "চ্যাট আইডি খুঁজুন")}
        </Button>
      </div>
      {msg && <Alert tone={msg.ok ? "success" : "error"}>{tm(msg.text)}</Alert>}
      {chats && chats.length > 0 && (
        <div className="rounded-xl border border-line">
          <p className="border-b border-line px-4 py-2 text-sm font-medium">{t("Chats that messaged your bot — copy the ID into", "যেসব চ্যাট থেকে বটকে মেসেজ পাঠানো হয়েছে — আইডিটা কপি করে বসান:")} <code>TELEGRAM_CHAT_ID</code></p>
          <ul className="divide-y divide-line text-sm">
            {chats.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2">
                <span>{c.name} <span className="text-ink-400">({c.type})</span></span>
                <button type="button" onClick={() => navigator.clipboard?.writeText(c.id)} className="inline-flex items-center gap-1.5 rounded-md bg-canvas px-2 py-1 font-mono font-semibold hover:bg-mint-50">
                  {c.id} <Copy className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!ready && (
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink-600">
          <li>{t("In Telegram, open @BotFather, send /newbot, choose a name and username. Copy the bot token it gives you.", "টেলিগ্রামে @BotFather খুলুন, /newbot লিখে পাঠান, একটা নাম আর ইউজারনেম দিন। যে টোকেন দেবে সেটা কপি করুন।")}</li>
          <li>{t("Open your new bot and send it any message (for a group: add the bot and send a message there).", "নতুন বটটা খুলে যেকোনো মেসেজ পাঠান (গ্রুপে চাইলে বটকে গ্রুপে যোগ করে সেখানে মেসেজ দিন)।")}</li>
          <li>{t("On Render: open your service → Environment, add TELEGRAM_BOT_TOKEN, then click “Find my chat ID” here.", "Render-এ: আপনার সার্ভিস → Environment-এ গিয়ে TELEGRAM_BOT_TOKEN যোগ করুন, তারপর এখানে “চ্যাট আইডি খুঁজুন” চাপুন।")}</li>
          <li>{t("Add the ID as TELEGRAM_CHAT_ID (comma-separate several), save, and wait for the site to update.", "আইডিটা TELEGRAM_CHAT_ID হিসেবে যোগ করুন (একাধিক হলে কমা দিয়ে), সেভ করুন, সাইট আপডেট হওয়া পর্যন্ত অপেক্ষা করুন।")}</li>
          <li>{t("Click “Send test message”.", "“টেস্ট মেসেজ পাঠান” চাপুন।")}</li>
        </ol>
      )}
    </Card>
  );
}
