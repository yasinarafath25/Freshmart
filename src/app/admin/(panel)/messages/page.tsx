import { desc } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { contactMessages } from "@/lib/db/schema";
import { NoAccess, PageHeader } from "@/components/admin/ui";
import { Badge, Card, EmptyState } from "@/components/ui";
import { markMessageHandledAction } from "@/app/admin/actions";
import { Inbox } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const { allowed } = await requireStaffPage("customers:read");
  if (!allowed) return <NoAccess />;
  const { t, dateTime } = await getI18n();
  const rows = await getDb().select().from(contactMessages).orderBy(contactMessages.isHandled, desc(contactMessages.createdAt)).limit(100);
  return (
    <>
      <PageHeader title={t("Messages", "মেসেজ")} description={t("Messages customers sent from the Contact page. Reply by email or phone, then mark them handled.", "গ্রাহকরা যোগাযোগ পেজ থেকে যে মেসেজ পাঠিয়েছেন। ইমেইল বা ফোনে উত্তর দিয়ে “সমাধান হয়েছে” চাপুন।")} />
      {rows.length === 0 ? <EmptyState icon={<Inbox className="size-7" />} title={t("No messages yet", "এখনো কোনো মেসেজ নেই")} /> : (
        <div className="space-y-3">
          {rows.map((m) => (
            <Card key={m.id} className={`p-5 ${m.isHandled ? "opacity-70" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{m.subject} {m.isHandled ? <Badge tone="green">{t("Handled", "সমাধান হয়েছে")}</Badge> : <Badge tone="yellow">{t("New", "নতুন")}</Badge>}</p>
                  <p className="text-sm text-ink-600">{m.name} · <a href={`mailto:${m.email}`} className="text-brand-700">{m.email}</a>{m.phone && ` · ${m.phone}`} · {dateTime(m.createdAt)}</p>
                </div>
                <form action={markMessageHandledAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="handled" value={m.isHandled ? "0" : "1"} />
                  <button className="text-sm font-semibold text-brand-700 hover:underline">{m.isHandled ? t("Mark as new", "নতুন হিসেবে রাখুন") : t("Mark handled", "সমাধান হয়েছে")}</button>
                </form>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{m.message}</p>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
