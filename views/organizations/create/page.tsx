import type { Metadata } from "next";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { OrganizationForm } from "@/app/sass/components/organization/OrganizationForm";
import { requireSession } from "@/libraries/Auth";

export const metadata: Metadata = {
  title: "New organization | VortexGin",
};

export default async function OrganizationCreatePage() {
  const session = await requireSession();

  return (
    <AuthComponent
      user={session.user}
      permissions={session.permissions}
      allowedPermissions={["authorized"]}
      accessDeniedComponent={
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
          <AccessDenied />
        </main>
      }
    >

      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <OrganizationForm mode="create" />
      </main>
    </AuthComponent>
  );
}
