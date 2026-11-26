import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Star } from "lucide-react";
import { requireStaffPage } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { products, reviews, users } from "@/lib/db/schema";
import { NoAccess, PageHeader } from "@/components/admin/ui";
import { Badge, Card, EmptyState } from "@/components/ui";
import { moderateReviewAction } from "@/app/admin/actions";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { allowed } = await requireStaffPage("reviews:write");
  if (!allowed) return <NoAccess />;
  const sp = await searchParams;
  const status = sp.status === "approved" || sp.status === "rejected" ? sp.status : "pending";
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
      <PageHeader title="Reviews" description="Only verified buyers can submit reviews. Approve to publish." />
      <div className="mb-4 flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <Link key={s} href={`/admin/reviews?status=${s}`} aria-current={s === status ? "page" : undefined} className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${s === status ? "bg-brand-700 text-white" : "border border-line bg-white"}`}>{s}</Link>
        ))}
      </div>
      {rows.length === 0 ? <EmptyState icon={<Star className="size-7" />} title={`No ${status} reviews`} /> : (
        <div className="space-y-3">
          {rows.map(({ r, user, product, slug }) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1" aria-label={`${r.rating} stars`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`size-4 ${n <= r.rating ? "fill-sun-400 text-sun-400" : "text-line"}`} aria-hidden />)}</p>
                  {r.title && <p className="mt-1 font-semibold">{r.title}</p>}
                  <p className="text-sm text-ink-600">{user} on <Link href={`/product/${slug}`} className="text-brand-700 hover:underline">{product}</Link> · {r.createdAt.toLocaleDateString("en-GB")}</p>
                </div>
                <div className="flex gap-2">
                  {(["approved", "rejected"] as const).filter((s) => s !== r.status).map((s) => (
                    <form key={s} action={moderateReviewAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value={s} />
                      <button className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${s === "approved" ? "bg-brand-700 text-white hover:bg-brand-800" : "border border-line hover:border-tomato-500 hover:text-tomato-600"}`}>{s === "approved" ? "Approve" : "Reject"}</button>
                    </form>
                  ))}
                  <Badge tone={r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "yellow"}>{r.status}</Badge>
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
