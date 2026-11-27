"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, CircleAlert, Copy, Loader2, Search, Send } from "lucide-react";
import { findTelegramChatsAction, sendTelegramTestAction } from "@/app/admin/actions";
import { Alert, Badge, Button, Card } from "@/components/ui";

export function TelegramCard({ hasToken, chatCount }: { hasToken: boolean; chatCount: number }) {
  const ready = hasToken && chatCount > 0;
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [chats, setChats] = useState<{ id: string; name: string; type: string }[] | null>(null);

  return (
    <Card className="max-w-4xl space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Telegram order alerts</h2>
          <p className="text-sm text-ink-600">Get a Telegram message for every new order and every customer cancellation.</p>
        </div>
        {ready ? (
          <Badge tone="green"><CheckCircle2 className="size-3.5" aria-hidden /> Connected ({chatCount} chat{chatCount > 1 ? "s" : ""})</Badge>
        ) : (
          <Badge tone="yellow"><CircleAlert className="size-3.5" aria-hidden /> Not set up</Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={ready ? "primary" : "secondary"}
          disabled={pending || !hasToken}
          onClick={() => start(async () => { const r = await sendTelegramTestAction(); setMsg({ ok: !!r?.ok, text: r?.message ?? "" }); })}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />} Send test message
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending || !hasToken}
          onClick={() => start(async () => { const r = await findTelegramChatsAction(); setChats(r.chats ?? null); setMsg(r.message ? { ok: r.ok, text: r.message } : null); })}
        >
          <Search className="size-4" aria-hidden /> Find my chat ID
        </Button>
      </div>
      {msg && <Alert tone={msg.ok ? "success" : "error"}>{msg.text}</Alert>}
      {chats && chats.length > 0 && (
        <div className="rounded-xl border border-line">
          <p className="border-b border-line px-4 py-2 text-sm font-medium">Chats that messaged your bot — copy the ID into <code>TELEGRAM_CHAT_ID</code>:</p>
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
          <li>In Telegram, open <b>@BotFather</b>, send <code>/newbot</code>, choose a name and username. Copy the <b>bot token</b> it gives you.</li>
          <li>Add it to <code>.env.local</code> as <code>TELEGRAM_BOT_TOKEN=…</code> and restart the site (<code>npm run dev</code>).</li>
          <li>Open your new bot in Telegram and send it any message (for a group: add the bot to the group and send a message there).</li>
          <li>Click <b>Find my chat ID</b> above, then add it as <code>TELEGRAM_CHAT_ID=…</code> (comma-separate several) and restart again.</li>
          <li>Click <b>Send test message</b>. In production set both values as Cloudflare secrets (<code>wrangler secret put …</code>).</li>
        </ol>
      )}
    </Card>
  );
}
