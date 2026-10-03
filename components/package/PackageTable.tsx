"use client";

import { useState, type FormEvent } from "react";
import { Table, type TableColumn, type TableRow } from "@/components/Table";
import { StatusBadge } from "@/components/StatusBadge";
import type { Package } from "@/app/sass/models/PackageModel";
import { deleteEncrypted, getEncrypted } from "@/libraries/EncryptedFetch";
import { SessionInfo } from "@/libraries/Auth";

const API_PATH = "/sass/api/v1/packages";

const COLUMNS: TableColumn[] = [
  { key: "name", label: "Name", field: "name" },
  { key: "type", label: "Type", field: "type" },
  { key: "duration", label: "Duration", field: "duration_days" },
  { key: "credit_quota", label: "Credit", field: "credit_quota" },
  { key: "status", label: "Status", field: "status" },
  { key: "created_at", label: "Created", field: "created_at" },
];

async function fetchPackageRows(params: URLSearchParams): Promise<TableRow[]> {
  let envelope;
  try {
    envelope = await getEncrypted<Package[]>(`${API_PATH}?${params.toString()}`);
  } catch {
    throw new Error("Something went wrong. Please try again.");
  }
  if (!envelope.success) {
    throw new Error(envelope.message || "Failed to fetch packages.");
  }
  return (envelope.data ?? []) as TableRow[];
}

async function deletePackageRow(uuid: string): Promise<string> {
  try {
    const envelope = await deleteEncrypted<{ message: string }>(`${API_PATH}/${uuid}`);
    return envelope.success ? "" : envelope.message || "Failed to delete package.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

function renderPackageCell(column: TableColumn, row: TableRow, value: unknown) {
  if (column.key === "duration") {
    const days = (row as Record<string, unknown>).duration_days;
    return <span className="whitespace-nowrap">{typeof days === "number" ? `${days} days` : "—"}</span>;
  }
  if (column.key === "credit_quota") {
    return <span className="whitespace-nowrap">{typeof value === "number" ? String(value) : "—"}</span>;
  }
  if (column.key === "status") {
    return <StatusBadge status={String(value)} />;
  }
  if (column.key === "created_at") {
    return <span className="whitespace-nowrap">{new Date(String(value)).toLocaleString()}</span>;
  }
  return undefined;
}

export function PackageTable({
  session,
}: {
  session: SessionInfo;
}) {
  const [draftQ, setDraftQ] = useState("");
  const [applied, setApplied] = useState<Record<string, string>>({});

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (draftQ.trim()) {
      next["filter[q]"] = draftQ.trim();
    }
    setApplied(next);
  }

  function resetFilters() {
    setDraftQ("");
    setApplied({});
  }

  return (
    <div>
      <form
        onSubmit={applyFilters}
        className="mt-6 flex flex-row gap-3"
      >
        <input
          type="search"
          value={draftQ}
          onChange={(event) => setDraftQ(event.target.value)}
          placeholder="Search name or description..."
          aria-label="Search packages"
          className="w-full flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
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
        actionUpdate={["authorized"]}
        actionDelete={["authorized"]}
        fetchRows={fetchPackageRows}
        basePath="/sass/views/packages"
        extraParams={applied}
        labelField="name"
        renderCell={renderPackageCell}
        onDelete={deletePackageRow}
      />
    </div>
  );
}
