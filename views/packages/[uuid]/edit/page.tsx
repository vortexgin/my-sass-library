import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDatabase } from "@/database/sequelize";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { PackageForm } from "@/app/sass/components/package/PackageForm";
import { requireSession } from "@/libraries/Auth";
import { PackageGetUseCase } from "@/app/sass/useCases/package/PackageGetUseCase";

export const metadata: Metadata = {
  title: "Edit package | VortexGin",
};

export default async function PackageEditPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const session = await requireSession();

  const { uuid } = await params;
  await connectDatabase();

  let item;
  try {
    item = await new PackageGetUseCase().exec(uuid);
  } catch {
    notFound();
  }
  if (!item) {
    notFound();
  }

  return (
    <AuthComponent
      user={session.user}
      permissions={session.permissions}
      allowedPermissions={["sass:package:view:update"]}
      accessDeniedComponent={
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
          <AccessDenied />
        </main>
      }
    >
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <PackageForm
          mode="edit"
          uuid={item.uuid}
          initial={{
            name: item.name,
            description: item.description,
            type: item.type,
            duration_days: item.duration_days,
            duration_description: item.duration_description,
            credit_quota: item.credit_quota,
            status: item.status,
            actions: item.actions,
          }}
        />
      </main>
    </AuthComponent>
  );
}
