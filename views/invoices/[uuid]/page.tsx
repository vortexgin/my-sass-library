import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDatabase } from "@/database/sequelize";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { INVOICE_LIST_PATH } from "@/app/sass/views/invoices/paths";
import { requireSession } from "@/libraries/Auth";
import { InvoiceGetUseCase } from "@/app/sass/useCases/invoice/InvoiceGetUseCase";

export const metadata: Metadata = {
  title: "Invoice detail | VortexGin",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-baseline sm:gap-6">
      <dt className="w-32 shrink-0 text-xs font-medium uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="break-all text-sm text-slate-900">{value}</dd>
    </div>
  );
}

function isCreditPackage(type: string | null): boolean {
  return type === "transaction" || type === "quota";
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const session = await requireSession();

  const { uuid } = await params;
  await connectDatabase();

  let invoice;
  try {
    invoice = await new InvoiceGetUseCase().exec(uuid);
  } catch {
    notFound();
  }
  if (!invoice) {
    notFound();
  }

  const packageType = invoice.package.type;

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
              {invoice.organization.name}
            </h1>

            <dl className="mt-6">
              <Row label="UUID" value={invoice.uuid} />
              <Row label="Organization" value={invoice.organization.name} />
              <Row label="Org NPWP" value={invoice.organization.npwp ?? "—"} />
              <Row label="Package" value={invoice.package.name} />
              <Row label="Package type" value={packageType ?? "—"} />
              <Row label="Start date" value={invoice.start_date ?? "—"} />
              <Row label="End date" value={invoice.end_date ?? "—"} />
              {isCreditPackage(packageType) ? (
                <>
                  <Row
                    label="Credit limit"
                    value={typeof invoice.credit_limit === "number" ? String(invoice.credit_limit) : "—"}
                  />
                  <Row label="Credit usage" value={String(invoice.credit_usage)} />
                </>
              ) : null}
              <Row label="Status" value={invoice.status} />
              <Row label="Created" value={invoice.created_at} />
              <Row label="Updated" value={invoice.updated_at} />
            </dl>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={INVOICE_LIST_PATH}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Back to list
              </Link>
            </div>
          </div>
        </div>
      </main>
    </AuthComponent>
  );
}
