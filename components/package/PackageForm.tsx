"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { PACKAGE_LIST_PATH } from "@/app/sass/views/packages/paths";
import type { Package, PackageAction } from "@/app/sass/models/PackageModel";
import type { Action } from "@/app/base/models/ActionModel";
import { getEncrypted, postEncrypted, putEncrypted } from "@/libraries/EncryptedFetch";
import { SelectField, TextAreaField, TextField } from "@/components/FormField";

const API_PATH = "/sass/api/v1/packages";
const ACTION_API_PATH = "/base/api/v1/actions";

type ActionOption = {
  uuid: string;
  action: string;
  description: string | null;
  isTransactions: boolean;
};

export function PackageForm({
  mode,
  uuid,
  initial,
}: {
  mode: "create" | "edit";
  uuid?: string;
  initial?: Pick<Package, "name" | "description" | "type" | "duration_days" | "duration_description" | "credit_quota" | "status" | "actions">;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [actionsLoading, setActionsLoading] = useState(true);
  const [packageType, setPackageType] = useState<"subscription" | "transaction" | "quota">(initial?.type ?? "subscription");
  const [actionOptions, setActionOptions] = useState<ActionOption[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const entry of initial?.actions ?? []) {
      next[entry.action_id] = typeof entry.credit === "number" ? String(entry.credit) : "";
    }
    return next;
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const envelope = await getEncrypted<Action[]>(
          `${ACTION_API_PATH}?sortProperty=action&sortDirection=asc&limit=100`,
        );
        if (!active) {
          return;
        }
        if (envelope.success) {
          setActionOptions(
            (envelope.data ?? []).map((action) => ({
              uuid: action.uuid,
              action: action.action,
              description: action.description,
              isTransactions: action.is_transactions === true,
            })),
          );
        } else if (active) {
          setError("Failed to load actions. Please try again.");
        }
      } catch {
        if (active) {
          setError("Failed to load actions. Please try again.");
        }
      } finally {
        if (active) {
          setActionsLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const [actionFilter, setActionFilter] = useState("");

  // Only transaction actions are packageable; search filters locally.
  const visibleOptions = actionOptions.filter(
    (option) =>
      option.isTransactions &&
      option.action.toLowerCase().includes(actionFilter.trim().toLowerCase()),
  );
  const selectedCount = Object.keys(selected).length;

  function toggleAction(actionId: string) {
    setSelected((current) => {
      const next = { ...current };
      if (actionId in next) {
        delete next[actionId];
      } else {
        next[actionId] = "";
      }
      return next;
    });
  }

  function updateCredit(actionId: string, credit: string) {
    setSelected((current) => ({ ...current, [actionId]: credit }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (actionsLoading) {
      setError("Actions are still loading. Please wait and try again.");
      return;
    }
    for (const credit of Object.values(selected)) {
      if (credit.trim() === "") {
        continue;
      }
      const parsed = Number(credit);
      if (!Number.isInteger(parsed) || parsed < 0) {
        setError("Credit for each selected action must be a non-negative integer.");
        return;
      }
    }
    setError("");
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const type = String(formData.get("type") ?? "subscription");
      const actions: PackageAction[] = Object.entries(selected).map(([action_id, credit]) => {
        const parsed = Number.parseInt(credit, 10);
        return Number.isNaN(parsed) ? { action_id } : { action_id, credit: parsed };
      });
      const payload: Record<string, unknown> = {
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? "") || null,
        type,
        actions,
        status: String(formData.get("status") ?? "active"),
      };
      if (type === "subscription") {
        const days = Number.parseInt(String(formData.get("duration_days") ?? ""), 10);
        payload.duration_days = Number.isNaN(days) ? null : days;
        payload.duration_description = String(formData.get("duration_description") ?? "") || null;
      } else {
        payload.duration_days = null;
        payload.duration_description = null;
      }
      if (type === "quota") {
        const quota = Number.parseInt(String(formData.get("credit_quota") ?? ""), 10);
        payload.credit_quota = Number.isNaN(quota) ? null : quota;
      } else {
        payload.credit_quota = null;
      }

      const envelope =
        mode === "create"
          ? await postEncrypted<Package>(API_PATH, payload)
          : await putEncrypted<Package>(`${API_PATH}/${uuid}`, payload);

      if (!envelope.success) {
        setError(envelope.message || `Failed to ${mode === "create" ? "create" : "update"} package.`);
        return;
      }

      router.push(PACKAGE_LIST_PATH);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
          {mode === "create" ? "New package" : "Edit package"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {mode === "create" ? "Create package." : "Update package."}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <TextField
            label="Name"
            type="text"
            name="name"
            required
            minLength={2}
            maxLength={120}
            defaultValue={initial?.name ?? ""}
            placeholder="e.g. Pro monthly"
          />

          <TextAreaField
            label="Description"
            name="description"
            rows={3}
            maxLength={255}
            defaultValue={initial?.description ?? ""}
            placeholder="What this package offers."
          />

          <SelectField
            label="Type"
            name="type"
            value={packageType}
            onChange={(event) => setPackageType(event.target.value as "subscription" | "transaction" | "quota")}
            options={[
              { value: "subscription", label: "subscription" },
              { value: "transaction", label: "transaction" },
              { value: "quota", label: "quota" },
            ]}
          />

          {packageType === "subscription" ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField
                label="Duration (days)"
                type="number"
                name="duration_days"
                min={1}
                defaultValue={initial?.duration_days ?? ""}
                placeholder="e.g. 30"
              />
              <TextField
                label="Duration description"
                type="text"
                name="duration_description"
                maxLength={255}
                defaultValue={initial?.duration_description ?? ""}
                placeholder="e.g. 1 month"
              />
            </div>
          ) : null}

          {packageType === "quota" ? (
            <TextField
              label="Credit quota"
              type="number"
              name="credit_quota"
              min={0}
              step={1}
              defaultValue={initial?.credit_quota ?? ""}
              placeholder="e.g. 1000"
            />
          ) : null}

          <div className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Actions ({selectedCount} selected)
            </span>
            <TextField
              type="search"
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              placeholder="Filter transaction actions..."
              aria-label="Filter actions"
              className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
              {actionOptions.length === 0 ? (
                <p className="px-1 py-2 text-sm text-slate-500">Loading actions...</p>
              ) : visibleOptions.length === 0 ? (
                <p className="px-1 py-2 text-sm text-slate-500">
                  No transaction actions found. Only actions flagged as transactions can be packaged.
                </p>
              ) : (
                visibleOptions.map((option) => (
                  <label key={option.uuid} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-inset ring-slate-200">
                    <input
                      type="checkbox"
                      checked={option.uuid in selected}
                      onChange={() => toggleAction(option.uuid)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-slate-900">{option.action}</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="Credit"
                      aria-label={`Credit for ${option.action}`}
                      disabled={!(option.uuid in selected)}
                      value={selected[option.uuid] ?? ""}
                      onChange={(event) => updateCredit(option.uuid, event.target.value)}
                      className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </label>
                ))
              )}
            </div>
          </div>

          <SelectField
            label="Status"
            name="status"
            defaultValue={initial?.status ?? "active"}
            options={[
              { value: "active", label: "active" },
              { value: "inactive", label: "inactive" },
            ]}
          />

          {error ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending || actionsLoading}
              className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {isPending ? "Saving..." : mode === "create" ? "Create package" : "Save changes"}
            </button>
            <Link
              href={PACKAGE_LIST_PATH}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
