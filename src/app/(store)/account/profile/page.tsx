import type { Metadata } from "next";
import { requireUserPage } from "@/lib/auth/guards";
import { getI18n } from "@/lib/i18n/server";
import { Card } from "@/components/ui";
import { PasswordForm, ProfileForm } from "@/components/store/AccountForms";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.account.profile, robots: { index: false } };
}

export default async function ProfilePage() {
  const user = await requireUserPage("/account/profile");
  const { d } = await getI18n();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{d.account.profile}</h1>
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">{d.account.personal}</h2>
        <ProfileForm name={user.name} phone={user.phone} email={user.email} />
      </Card>
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">{d.account.changePassword}</h2>
        <PasswordForm />
      </Card>
    </div>
  );
}
