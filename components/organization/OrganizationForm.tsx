"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ORGANIZATION_LIST_PATH } from "@/app/sass/views/organizations/paths";
import type { Organization } from "@/app/sass/models/OrganizationModel";
import { postEncrypted, putEncrypted } from "@/libraries/EncryptedFetch";

const API_PATH = "/sass/api/v1/organizations";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export function OrganizationForm({
  mode,
  uuid,
  initial,
}: {
  mode: "create" | "edit";
  uuid?: string;
  initial?: Pick<Organization, "name" | "address" | "email" | "phone" | "npwp" | "status">;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const payload = {
        name: String(formData.get("name") ?? ""),
        address: String(formData.get("address") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        npwp: String(formData.get("npwp") ?? "") || null,
        status: String(formData.get("status") ?? "active"),
      };

      const envelope =
        mode === "create"
          ? await postEncrypted<Organization>(API_PATH, payload)
          : await putEncrypted<Organization>(`${API_PATH}/${uuid}`, payload);

      if (!envelope.success) {
        setError(envelope.message || `Failed to ${mode === "create" ? "create" : "update"} organization.`);
        return;
      }

      router.push(ORGANIZATION_LIST_PATH);
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
          {mode === "create" ? "New organization" : "Edit organization"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {mode === "create" ? "Create organization." : "Update organization."}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
            <input
              type="text"
              name="name"
              required
              minLength={2}
              maxLength={120}
              defaultValue={initial?.name ?? ""}
              placeholder="Organization name"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Address</span>
            <input
              type="text"
              name="address"
              required
              minLength={5}
              maxLength={255}
              defaultValue={initial?.address ?? ""}
              placeholder="Street, city"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              name="email"
              required
              maxLength={160}
              defaultValue={initial?.email ?? ""}
              placeholder="org@company.com"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Phone</span>
            <input
              type="tel"
              name="phone"
              required
              minLength={6}
              maxLength={30}
              defaultValue={initial?.phone ?? ""}
              placeholder="+15550001111"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">NPWP</span>
            <input
              type="text"
              name="npwp"
              maxLength={30}
              defaultValue={initial?.npwp ?? ""}
              placeholder="Optional"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
            <select name="status" defaultValue={initial?.status ?? "active"} className={inputClass}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>

          {error ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {isPending ? "Saving..." : mode === "create" ? "Create organization" : "Save changes"}
            </button>
            <Link
              href={ORGANIZATION_LIST_PATH}
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
