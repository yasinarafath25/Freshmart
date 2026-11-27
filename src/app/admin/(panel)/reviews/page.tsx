import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Star } from "lucide-react";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { products, reviews, users } from "@/lib/db/schema";
import { NoAccess, PageHeader } from "@/components/admin/ui";
import { Badge, Card, EmptyState } from "@/components/ui";
import { moderateReviewAction } from "@/app/admin/actions";
import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { allowed } = await requireStaffPage("reviews:write");
  if (!allowed) return <NoAccess />;
  const sp = await searchParams;
  const status = sp.status === "approved" || sp.status === "rejected" ? sp.status : "pending";
  const { t, date, num } = await getI18n();
  const label = { pending: t("Waiting", "অপেক্ষায়"), approved: t("Approved", "অনুমোদিত"), rejected: t("Rejected", "বাতিল") };
  const rows = await getDb()
    .select({ r: reviews, user: users.name, product: products.name, slug: products.slug })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .innerJoin(products, eq(products.id, reviews.productId))
    .where(eq(reviews.status, status))
    .orderBy(desc(reviews.createdAt))
    .limit(100);
  return (
    <>
      <PageHeader title={t("Reviews", "রিভিউ")} description={t("Only customers who bought the product can review it. Approve a review to show it in the store.", "শুধু যারা পণ্যটি কিনেছেন তারাই রিভিউ দিতে পারেন। অনুমোদন দিলে রিভিউটি স্টোরে দেখাবে।")} />
      <div className="mb-4 flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <Link key={s} href={`/admin/reviews?status=${s}`} aria-current={s === status ? "page" : undefined} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${s === status ? "bg-brand-700 text-white" : "border border-line bg-white"}`}>{label[s]}</Link>
        ))}
      </div>
      {rows.length === 0 ? <EmptyState icon={<Star className="size-7" />} title={t(`No ${status} reviews`, `“${label[status]}” কোনো রিভিউ নেই`)} /> : (
        <div className="space-y-3">
          {rows.map(({ r, user, product, slug }) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1" aria-label={t(`${r.rating} stars`, `${num(r.rating)} তারা`)}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`size-4 ${n <= r.rating ? "fill-sun-400 text-sun-400" : "text-line"}`} aria-hidden />)}</p>
                  {r.title && <p className="mt-1 font-semibold">{r.title}</p>}
                  <p className="text-sm text-ink-600">{user} · <Link href={`/product/${slug}`} className="text-brand-700 hover:underline">{product}</Link> · {date(r.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  {(["approved", "rejected"] as const).filter((s) => s !== r.status).map((s) => (
                    <form key={s} action={moderateReviewAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value={s} />
                      <button className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${s === "approved" ? "bg-brand-700 text-white hover:bg-brand-800" : "border border-line hover:border-tomato-500 hover:text-tomato-600"}`}>{s === "approved" ? t("Approve", "অনুমোদন দিন") : t("Reject", "বাতিল করুন")}</button>
                    </form>
                  ))}
                  <Badge tone={r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "yellow"}>{label[r.status as keyof typeof label] ?? r.status}</Badge>
                </div>
              </div>
              <p className="mt-3 text-sm">{r.body}</p>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
