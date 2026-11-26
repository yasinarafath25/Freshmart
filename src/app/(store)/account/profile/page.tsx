import type { Metadata } from "next";
import { requireUserPage } from "@/lib/auth/guards";
import { Card } from "@/components/ui";
import { PasswordForm, ProfileForm } from "@/components/store/AccountForms";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function ProfilePage() {
  const user = await requireUserPage("/account/profile");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile &amp; security</h1>
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Personal details</h2>
        <ProfileForm name={user.name} phone={user.phone} email={user.email} />
      </Card>
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Change password</h2>
        <PasswordForm />
      </Card>
    </div>
  );
}
