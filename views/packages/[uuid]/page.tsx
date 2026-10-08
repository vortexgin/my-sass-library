import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDatabase } from "@/database/sequelize";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { DeletePackageButton } from "@/app/sass/components/package/DeletePackageButton";
import { PACKAGE_LIST_PATH } from "@/app/sass/views/packages/paths";
import { requireSession } from "@/libraries/Auth";
import { PackageGetUseCase } from "@/app/sass/useCases/package/PackageGetUseCase";
import { formatMoney } from "@/libraries/Currency";
import ActionModelFactory, { ActionModel } from "@/app/base/models/ActionModel";

export const metadata: Metadata = {
  title: "Package detail | VortexGin",
};

function Row({ label, value, numeric }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-baseline sm:gap-6">
      <dt className="w-32 shrink-0 text-xs font-medium uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className={`break-all text-sm text-slate-900${numeric ? " tabular-nums sm:ml-auto sm:text-right" : ""}`}>{value}</dd>
    </div>
  );
}

export default async function PackageDetailPage({
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

  const actionIds = item.actions.map((entry) => entry.action_id);
  let actionNames = new Map<string, string>();
  if (actionIds.length > 0) {
    await ActionModelFactory();
    const actions = await ActionModel.findAll({ where: { uuid: actionIds } });
    actionNames = new Map(actions.map((action) => [action.uuid, action.action]));
  }

  return (
    <AuthComponent
      user={session.user}
      permissions={session.permissions}
      allowedPermissions={["sass:package:view:detail"]}
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
              {item.name}
            </h1>

            <dl className="mt-6">
              <Row label="UUID" value={item.uuid} />
              <Row label="Name" value={item.name} />
              <Row label="Description" value={item.description ?? "—"} />
              <Row label="Type" value={item.type} />
              {item.type === "subscription" ? (
                <>
                  <Row
                    label="Duration"
                    value={typeof item.duration_days === "number" ? `${item.duration_days} days` : "—"}
                  />
                  <Row label="Duration note" value={item.duration_description ?? "—"} />
                </>
              ) : null}
              {item.type === "quota" ? (
                <Row
                  label="Credit quota"
                  value={formatMoney(item.credit_quota)}
                  numeric
                />
              ) : null}
              <Row
                label="Actions"
                value={
                  item.actions.length > 0
                    ? item.actions
                      .map((entry) => {
                        const code = actionNames.get(entry.action_id) ?? entry.action_id;
                        return typeof entry.credit === "number"
                          ? `${code} (${entry.credit})`
                          : code;
                      })
                      .join(", ")
                    : "—"
                }
              />
              <Row label="Status" value={item.status} />
              <Row label="Created" value={item.created_at} />
              <Row label="Updated" value={item.updated_at} />
            </dl>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={PACKAGE_LIST_PATH}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Back to list
              </Link>
              <AuthComponent
                user={session.user}
                permissions={session.permissions}
                allowedPermissions={["sass:package:view:update"]}
              >
                <Link
                  href={`/sass/views/packages/${item.uuid}/edit`}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Edit
                </Link>
              </AuthComponent>
              <AuthComponent
                user={session.user}
                permissions={session.permissions}
                allowedPermissions={["sass:package:view:delete"]}
              >
                <DeletePackageButton uuid={item.uuid} label={item.name} redirectTo={PACKAGE_LIST_PATH} />
              </AuthComponent>

            </div>
          </div>
        </div>
      </main>
    </AuthComponent>
  );
}
