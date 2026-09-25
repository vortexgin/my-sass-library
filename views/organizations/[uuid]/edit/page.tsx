import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDatabase } from "@/database/sequelize";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { OrganizationForm } from "@/app/sass/components/organization/OrganizationForm";
import { requireSession } from "@/libraries/Auth";
import { OrganizationGetUseCase } from "@/app/sass/useCases/organization/OrganizationGetUseCase";

export const metadata: Metadata = {
  title: "Edit organization | VortexGin",
};

export default async function OrganizationEditPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const session = await requireSession();

  const { uuid } = await params;
  await connectDatabase();

  let organization;
  try {
    organization = await new OrganizationGetUseCase().exec(uuid);
  } catch {
    notFound();
  }
  if (!organization) {
    notFound();
  }

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
        <OrganizationForm
          mode="edit"
          uuid={organization.uuid}
          initial={{
            name: organization.name,
            address: organization.address,
            email: organization.email,
            phone: organization.phone,
            npwp: organization.npwp,
            status: organization.status,
          }}
        />
      </main>
    </AuthComponent>
  );
}
