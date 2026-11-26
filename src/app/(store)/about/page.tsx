import type { Metadata } from "next";
import { ContentPage } from "@/components/store/ContentPage";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "About Us", alternates: { canonical: "/about" } };

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <ContentPage title={"About Us"} intro={"We started with a simple idea: everyone deserves fresh, honest food at fair prices."}>
      <h2>Our story</h2>
<p>{s.storeName} connects local farms and trusted suppliers with households across {s.defaultLocation}. Every morning our team checks produce for freshness, ripeness and quality before it is packed for delivery.</p>
<h2>What we promise</h2>
<ul><li>Fresh produce, quality-checked daily</li><li>Clear prices per kg, piece or bunch — no surprises</li><li>On-time delivery in your chosen slot</li><li>Easy returns at the doorstep if something isn’t right</li></ul>
<h2>Working with farmers</h2>
<p>We buy directly from growers wherever we can, so more of what you pay reaches the people who grow your food.</p>
    </ContentPage>
  );
}
