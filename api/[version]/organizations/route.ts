import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { withEncryption } from "@/libraries/EncryptedRoute";
import { fail, getErrorStatus, ok, queryParam } from "@/libraries/Http";
import { OrganizationCreateUseCase } from "@/app/sass/useCases/organization/OrganizationCreateUseCase";
import { OrganizationListUseCase } from "@/app/sass/useCases/organization/OrganizationListUseCase";
import type { CreateOrganizationInput } from "@/app/sass/models/OrganizationModel";

export const runtime = "nodejs";

async function handleGet(request: NextRequest) {
  try {
    await connectDatabase();
    const params = request.nextUrl.searchParams;
    const organizations = await new OrganizationListUseCase().exec({
      filter: {
        q: queryParam(params, "filter[q]"),
        name: queryParam(params, "filter[name]"),
        email: queryParam(params, "filter[email]"),
      },
      sortProperty: queryParam(params, "sortProperty"),
      sortDirection: queryParam(params, "sortDirection"),
      offset: queryParam(params, "offset"),
      limit: queryParam(params, "limit"),
    });
    return ok(organizations);
  } catch (error: any) {
    return fail(error.message ?? "Failed to fetch organizations.", getErrorStatus(error, 500));
  }
}

async function handlePost(request: NextRequest) {
  try {
    await connectDatabase();
    const payload = (await request.json()) as Partial<CreateOrganizationInput>;

    const organization = await new OrganizationCreateUseCase().exec(payload as CreateOrganizationInput);
    return ok(organization, 201);
  } catch (error: any) {
    return fail(error.message ?? "Failed to create organization.", getErrorStatus(error, 500));
  }
}

export const GET = withAuthorization(withEncryption(handleGet), ["authorized"]);
export const POST = withAuthorization(withEncryption(handlePost), ["authorized"]);
