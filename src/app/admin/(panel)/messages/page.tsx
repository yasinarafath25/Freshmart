import { desc } from "drizzle-orm";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { contactMessages } from "@/lib/db/schema";
import { NoAccess, PageHeader } from "@/components/admin/ui";
import { Badge, Card, EmptyState } from "@/components/ui";
import { markMessageHandledAction } from "@/app/admin/actions";
import { Inbox } from "lucide-react";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const { allowed } = await requireStaffPage("customers:read");
  if (!allowed) return <NoAccess />;
  const rows = await getDb().select().from(contactMessages).orderBy(contactMessages.isHandled, desc(contactMessages.createdAt)).limit(100);
  return (
    <>
      <PageHeader title="Messages" description="Contact-form messages from customers." />
      {rows.length === 0 ? <EmptyState icon={<Inbox className="size-7" />} title="No messages" /> : (
        <div className="space-y-3">
          {rows.map((m) => (
            <Card key={m.id} className={`p-5 ${m.isHandled ? "opacity-70" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{m.subject} {m.isHandled ? <Badge tone="green">Handled</Badge> : <Badge tone="yellow">New</Badge>}</p>
                  <p className="text-sm text-ink-600">{m.name} · <a href={`mailto:${m.email}`} className="text-brand-700">{m.email}</a>{m.phone && ` · ${m.phone}`} · {m.createdAt.toLocaleString("en-GB")}</p>
                </div>
                <form action={markMessageHandledAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="handled" value={m.isHandled ? "0" : "1"} />
                  <button className="text-sm font-semibold text-brand-700 hover:underline">{m.isHandled ? "Mark as new" : "Mark handled"}</button>
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
