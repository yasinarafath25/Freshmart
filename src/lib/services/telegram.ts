import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { orders, users } from "@/lib/db/schema";
import { loadOrderDetail } from "./orders";
import { getSettings } from "./settings";
import { formatMoney } from "@/lib/utils/money";

/**
 * Telegram alerts for the store team via the Bot API (plain HTTPS — works on Workers).
 * Configure with secrets:
 *   TELEGRAM_BOT_TOKEN  — from @BotFather
 *   TELEGRAM_CHAT_ID    — your chat / group id (comma-separate several)
 * Failures are logged and never block checkout.
 */
function config() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatIds = (process.env.TELEGRAM_CHAT_ID ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return { token, chatIds };
}

export function telegramStatus() {
  const { token, chatIds } = config();
  return { hasToken: !!token, chatCount: chatIds.length, ready: !!token && chatIds.length > 0 };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function call(method: string, body: Record<string, unknown>) {
  const { token } = config();
  if (!token) return { ok: false as const, error: "TELEGRAM_BOT_TOKEN is not set" };
  try {
    const base = process.env.TELEGRAM_API_BASE ?? "https://api.telegram.org"; // override only for local testing
    const res = await fetch(`${base}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string; result?: unknown };
    if (!res.ok || !json.ok) return { ok: false as const, error: json.description ?? `HTTP ${res.status}` };
    return { ok: true as const, result: json.result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    if (/abort|timeout|fetch failed|ECONN|ENOTFOUND|ETIMEDOUT/i.test(msg))
      return { ok: false as const, error: "Could not reach Telegram (api.telegram.org). This network seems to block Telegram — it will work on the live server, or here with a VPN." };
    return { ok: false as const, error: msg };
  }
}

/** Send an HTML-formatted message to every configured chat. */
export async function sendTelegram(html: string): Promise<{ ok: boolean; error?: string }> {
  const { token, chatIds } = config();
  if (!token || chatIds.length === 0) return { ok: false, error: "Telegram is not configured" };
  const results = await Promise.all(chatIds.map((chat_id) => call("sendMessage", { chat_id, text: html, parse_mode: "HTML", disable_web_page_preview: true })));
  const failed = results.find((r) => !r.ok);
  if (failed && !failed.ok) {
    console.error("[telegram] send failed:", failed.error);
    return { ok: false, error: failed.error };
  }
  return { ok: true };
}

/** Recent chats that messaged the bot — used to discover your chat id during setup. */
export async function findTelegramChats(): Promise<{ ok: true; chats: { id: string; name: string; type: string }[] } | { ok: false; error: string }> {
  const res = await call("getUpdates", { limit: 50, allowed_updates: ["message", "channel_post", "my_chat_member"] });
  if (!res.ok) return res;
  type Chat = { id: number; type: string; title?: string; first_name?: string; last_name?: string; username?: string };
  const updates = (res.result ?? []) as { message?: { chat: Chat }; channel_post?: { chat: Chat }; my_chat_member?: { chat: Chat } }[];
  const map = new Map<string, { id: string; name: string; type: string }>();
  for (const u of updates) {
    const c = u.message?.chat ?? u.channel_post?.chat ?? u.my_chat_member?.chat;
    if (!c) continue;
    const name = c.title ?? ([c.first_name, c.last_name].filter(Boolean).join(" ") || (c.username ? `@${c.username}` : String(c.id)));
    map.set(String(c.id), { id: String(c.id), name, type: c.type });
  }
  return { ok: true, chats: [...map.values()] };
}

function adminLink(orderId: string) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}/admin/orders/${orderId}`;
}

/** Telegram may reject links to localhost/private hosts — show those as plain text instead. */
function linkLine(label: string, orderId: string) {
  const url = adminLink(orderId);
  const local = /^https?:\/\/(localhost|127\.|10\.|192\.168\.|\[::1\])/i.test(url);
  return local ? `👉 ${label}: ${esc(url)}` : `👉 <a href="${esc(url)}">${label}</a>`;
}

/** 🛒 New order alert with items, totals, address and a link to the admin page. */
export async function notifyNewOrder(orderId: string) {
  if (!telegramStatus().ready) return;
  try {
    const db = getDb();
    const o = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!o) return;
    const [detail, customer, settings] = await Promise.all([loadOrderDetail(o), db.query.users.findFirst({ where: eq(users.id, o.userId) }), getSettings()]);
    const m = (n: number) => esc(formatMoney(n, settings.currencySymbol));
    const items = detail.items.map((it) => `• ${esc(it.productName)} (${esc(it.variantName)}) × ${it.quantity} = ${m(it.lineTotal)}`).join("\n");
    const address = [o.shipLine1, o.shipLine2, o.shipArea, o.shipCity, o.shipPostalCode].filter(Boolean).map((x) => esc(String(x))).join(", ");
    const lines = [
      `🛒 <b>New order ${esc(o.orderNumber)}</b>`,
      "",
      `👤 ${esc(o.shipName)} · ${esc(o.shipPhone)}${customer ? `\n✉️ ${esc(customer.email)}` : ""}`,
      `📍 ${address}`,
      `🚚 ${esc(o.zoneName ?? "")} · ${esc(o.deliveryDate ?? "")} · ${esc(o.deliverySlot ?? "")}`,
      "",
      items,
      "",
      `Subtotal: ${m(o.subtotal)}${o.discount ? `\nDiscount${o.couponCode ? ` (${esc(o.couponCode)})` : ""}: −${m(o.discount)}` : ""}`,
      `Delivery: ${o.deliveryFee ? m(o.deliveryFee) : "Free"}`,
      `<b>Total: ${m(o.total)}</b> · ${o.paymentMethod === "cod" ? "💵 Cash on delivery" : "💳 Online"}`,
      o.notes ? `\n📝 ${esc(o.notes)}` : "",
      "",
      linkLine("Open in admin to confirm", o.id),
    ];
    await sendTelegram(lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").trim());
  } catch (e) {
    console.error("[telegram] notifyNewOrder failed", e);
  }
}

/** ❌ Customer cancelled an order. */
export async function notifyOrderCancelled(orderId: string, reason?: string) {
  if (!telegramStatus().ready) return;
  try {
    const db = getDb();
    const o = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!o) return;
    const settings = await getSettings();
    await sendTelegram(
      [
        `❌ <b>Order ${esc(o.orderNumber)} cancelled by the customer</b>`,
        `👤 ${esc(o.shipName)} · ${esc(o.shipPhone)}`,
        `Total: ${esc(formatMoney(o.total, settings.currencySymbol))}`,
        reason ? `Reason: ${esc(reason)}` : "",
        linkLine("View order", o.id),
      ]
        .filter(Boolean)
        .join("\n"),
    );
  } catch (e) {
    console.error("[telegram] notifyOrderCancelled failed", e);
  }
}
