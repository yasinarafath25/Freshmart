import type { Metadata } from "next";
import { ContentPage } from "@/components/store/ContentPage";

export const metadata: Metadata = { title: "Refund & Return Policy", alternates: { canonical: "/refund-policy" } };

export default function RefundPolicyPage() {
  return (
    <ContentPage title={"Refund & Return Policy"} updated="26 November 2026">
      <h2>Fresh produce</h2>
<p>Please check your items when they arrive. If anything is damaged, spoiled or incorrect, you can return it to the delivery rider on the spot, or contact us within 24 hours with a photo.</p>
<h2>Packaged groceries</h2>
<p>Unopened packaged items can be returned within 3 days of delivery.</p>
<h2>How refunds work</h2>
<ul><li>Cash on delivery: we refund the amount for returned items at the door or credit it to your next order.</li><li>Online payments: refunds go back to the original payment method within 5–7 business days.</li></ul>
<h2>Cancelled orders</h2>
<p>If you cancel an order you already paid online, our team will contact you to arrange your refund.</p>
    </ContentPage>
  );
}
