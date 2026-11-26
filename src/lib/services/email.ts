import "server-only";

/**
 * Transactional email via Resend's HTTP API (works on Workers — plain fetch).
 * When RESEND_API_KEY is not configured, the email is logged to the server console instead
 * (development only — configure the key before production).
 */
export async function sendEmail(to: string, subject: string, text: string): Promise<{ sent: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.info(`[email:not-configured] to=${to} subject="${subject}"\n${text}`);
    return { sent: false };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text }),
    });
    if (!res.ok) console.error("[email] Resend error", res.status, await res.text());
    return { sent: res.ok };
  } catch (e) {
    console.error("[email] send failed", e);
    return { sent: false };
  }
}
