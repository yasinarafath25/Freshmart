import type { Metadata } from "next";
import { ContentPage } from "@/components/store/ContentPage";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy-policy" } };

export default async function PrivacyPolicyPage() {
  const s = await getSettings();
  return (
    <ContentPage title={"Privacy Policy"} updated="26 November 2026">
      <p>This policy explains what personal information {s.storeName} collects and how we use it.</p>
<h2>Information we collect</h2>
<ul><li>Account details: name, email, phone number and password (stored only as a secure hash)</li><li>Delivery addresses you save or enter at checkout</li><li>Order history and payment status (we never store card numbers)</li><li>Basic technical data such as IP address for security and fraud prevention</li></ul>
<h2>How we use it</h2>
<ul><li>To process and deliver your orders</li><li>To contact you about your orders</li><li>To protect accounts and prevent abuse</li><li>To send offers only if you subscribe to our newsletter</li></ul>
<h2>Sharing</h2>
<p>We share data only with service providers needed to run the store (hosting, payment gateway, email delivery) and when required by law. We never sell your data.</p>
<h2>Your choices</h2>
<p>You can update your profile and addresses in your account, unsubscribe from emails at any time, and ask us to delete your account by contacting support.</p>
    </ContentPage>
  );
}
