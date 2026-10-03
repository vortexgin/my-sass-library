import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { fail, getErrorStatus, ok } from "@/libraries/Http";
import { PackageDeleteUseCase } from "@/app/sass/useCases/package/PackageDeleteUseCase";
import { PackageGetUseCase } from "@/app/sass/useCases/package/PackageGetUseCase";
import { PackageUpdateUseCase } from "@/app/sass/useCases/package/PackageUpdateUseCase";
import type { UpdatePackageInput } from "@/app/sass/models/PackageModel";

export const runtime = "nodejs";

async function handleGet(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const item = await new PackageGetUseCase().exec(uuid);

    return ok(item);
  } catch (error: any) {
    return fail(error.message ?? "Failed to fetch package.", getErrorStatus(error, 500));
  }
}

async function handlePut(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const payload = (await request.json()) as UpdatePackageInput;

    const item = await new PackageUpdateUseCase().exec(uuid, payload);
    return ok(item);
  } catch (error: any) {
    return fail(error.message ?? "Failed to update package.", getErrorStatus(error, 400));
  }
}

async function handleDelete(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const deleted = await new PackageDeleteUseCase().exec(uuid);

    if (!deleted) {
      return fail("Package not found.", 404);
    }

    return ok({ message: "Package deleted successfully." });
  } catch (error: any) {
    return fail(error.message ?? "Failed to delete package.", getErrorStatus(error, 400));
  }
}

export const GET = withAuthorization(handleGet, ["sass:package:view:detail"]);
export const PUT = withAuthorization(handlePut, ["sass:package:view:update"]);
export const DELETE = withAuthorization(handleDelete, ["sass:package:view:delete"]);
