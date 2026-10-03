"use client";

import { useState, type FormEvent } from "react";
import { Table, type TableColumn, type TableRow } from "@/components/Table";
import { StatusBadge } from "@/components/StatusBadge";
import type { Invoice } from "@/app/sass/models/InvoiceModel";
import { getEncrypted } from "@/libraries/EncryptedFetch";
import { SessionInfo } from "@/libraries/Auth";

const API_PATH = "/sass/api/v1/invoices";

const COLUMNS: TableColumn[] = [
  { key: "organization", label: "Organization", field: "org_name" },
  { key: "package", label: "Package", field: "package_name" },
  { key: "period", label: "Period", field: "period" },
  { key: "credits", label: "Credits", field: "credits" },
  { key: "status", label: "Status", field: "status" },
  { key: "created_at", label: "Created", field: "created_at" },
];

function toRow(invoice: Invoice): TableRow {
  const period = [invoice.start_date, invoice.end_date].filter(Boolean).join(" → ") || "—";
  const credits =
    typeof invoice.credit_limit === "number" ? `${invoice.credit_usage}/${invoice.credit_limit}` : "—";
  return {
    uuid: invoice.uuid,
    org_name: invoice.organization.name,
    package_name: invoice.package.name,
    period,
    credits,
    status: invoice.status,
    created_at: invoice.created_at,
  };
}

async function fetchInvoiceRows(params: URLSearchParams): Promise<TableRow[]> {
  let envelope;
  try {
    envelope = await getEncrypted<Invoice[]>(`${API_PATH}?${params.toString()}`);
  } catch {
    throw new Error("Something went wrong. Please try again.");
  }
  if (!envelope.success) {
    throw new Error(envelope.message || "Failed to fetch invoices.");
  }
  return (envelope.data ?? []).map(toRow);
}

function renderInvoiceCell(column: TableColumn, row: TableRow, value: unknown) {
  if (column.key === "status") {
    return <StatusBadge status={String(value)} />;
  }
  if (column.key === "created_at") {
    return <span className="whitespace-nowrap">{new Date(String(value)).toLocaleString()}</span>;
  }
  return undefined;
}

const STATUS_OPTIONS = ["", "running", "active", "inactive", "paid", "deleted"];

export function InvoiceTable({
  session,
}: {
  session: SessionInfo;
}) {
  const [draftStatus, setDraftStatus] = useState("");
  const [applied, setApplied] = useState<Record<string, string>>({});

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (draftStatus) {
      next["filter[status]"] = draftStatus;
    }
    setApplied(next);
  }

  function resetFilters() {
    setDraftStatus("");
    setApplied({});
  }

  return (
    <div>
      <form
        onSubmit={applyFilters}
        className="mt-6 flex flex-row gap-3"
      >
        <select
          value={draftStatus}
          onChange={(event) => setDraftStatus(event.target.value)}
          aria-label="Filter by status"
          className="w-full flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <div className="flex shrink-0 gap-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Filter
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </form>

      <Table
        key={JSON.stringify(applied)}
        session={session}
        columns={COLUMNS}
        actionUpdate={["__none__"]}
        actionDelete={["__none__"]}
        fetchRows={fetchInvoiceRows}
        basePath="/sass/views/invoices"
        extraParams={applied}
        labelField="org_name"
        renderCell={renderInvoiceCell}
      />
    </div>
  );
}
