import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDatabase } from "@/database/sequelize";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { DeleteOrganizationButton } from "@/app/sass/components/organization/DeleteOrganizationButton";
import { ORGANIZATION_LIST_PATH } from "@/app/sass/views/organizations/paths";
import { requireSession } from "@/libraries/Auth";
import { OrganizationGetUseCase } from "@/app/sass/useCases/organization/OrganizationGetUseCase";

export const metadata: Metadata = {
  title: "Organization detail | VortexGin",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-baseline sm:gap-6">
      <dt className="w-32 shrink-0 text-xs font-medium uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="break-all text-sm text-slate-900">{value}</dd>
    </div>
  );
}

export default async function OrganizationDetailPage({
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
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">Detail</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {organization.name}
            </h1>

            <dl className="mt-6">
              <Row label="UUID" value={organization.uuid} />
              <Row label="Name" value={organization.name} />
              <Row label="Address" value={organization.address} />
              <Row label="Email" value={organization.email} />
              <Row label="Phone" value={organization.phone} />
              <Row label="NPWP" value={organization.npwp ?? "—"} />
              <Row label="Status" value={organization.status} />
              <Row label="Created" value={organization.created_at} />
              <Row label="Updated" value={organization.updated_at} />
            </dl>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={ORGANIZATION_LIST_PATH}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Back to list
              </Link>
              <AuthComponent
                user={session.user}
                permissions={session.permissions}
                allowedPermissions={["authorized"]}
              >
                <Link
                  href={`/sass/views/organizations/${organization.uuid}/edit`}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Edit
                </Link>
              </AuthComponent>
              <AuthComponent
                user={session.user}
                permissions={session.permissions}
                allowedPermissions={["authorized"]}
              >
                <DeleteOrganizationButton uuid={organization.uuid} label={organization.name} redirectTo={ORGANIZATION_LIST_PATH} />
              </AuthComponent>

            </div>
          </div>
        </div>
      </main>
    </AuthComponent>
  );
}
