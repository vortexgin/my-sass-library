import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { withEncryption } from "@/libraries/EncryptedRoute";
import { fail, getErrorStatus, ok } from "@/libraries/Http";
import { OrganizationDeleteUseCase } from "@/app/sass/useCases/organization/OrganizationDeleteUseCase";
import { OrganizationGetUseCase } from "@/app/sass/useCases/organization/OrganizationGetUseCase";
import { OrganizationUpdateUseCase } from "@/app/sass/useCases/organization/OrganizationUpdateUseCase";
import type { UpdateOrganizationInput } from "@/app/sass/models/OrganizationModel";

export const runtime = "nodejs";

async function handleGet(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const organization = await new OrganizationGetUseCase().exec(uuid);

    return ok(organization);
  } catch (error: any) {
    return fail(error.message ?? "Failed to fetch organization.", getErrorStatus(error, 500));
  }
}

async function handlePut(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const payload = (await request.json()) as UpdateOrganizationInput;

    const organization = await new OrganizationUpdateUseCase().exec(uuid, payload);
    return ok(organization);
  } catch (error: any) {
    return fail(error.message ?? "Failed to update organization.", getErrorStatus(error, 400));
  }
}

async function handleDelete(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const deleted = await new OrganizationDeleteUseCase().exec(uuid);

    if (!deleted) {
      return fail("Organization not found.", 404);
    }

    return ok({ message: "Organization deleted successfully." });
  } catch (error: any) {
    return fail(error.message ?? "Failed to delete organization.", getErrorStatus(error, 400));
  }
}

export const GET = withAuthorization(withEncryption(handleGet), ["authorized"]);
export const PUT = withAuthorization(withEncryption(handlePut), ["authorized"]);
export const DELETE = withAuthorization(withEncryption(handleDelete), ["authorized"]);
