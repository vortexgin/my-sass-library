import type { Metadata } from "next";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { InvoiceTable } from "@/app/sass/components/invoice/InvoiceTable";
import { requireSession } from "@/libraries/Auth";

export const metadata: Metadata = {
  title: "Invoices | VortexGin",
};

export default async function InvoiceListPage() {
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
        <div className="w-full">
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">Sass</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Invoices.</h1>
              <p className="mt-2 text-sm text-slate-500">
                Read-only billing records.
              </p>
            </div>

            <InvoiceTable session={session} />
          </div>
        </div>
      </main>
    </AuthComponent>
  );
}
