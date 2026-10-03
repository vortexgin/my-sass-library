import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { fail, getErrorStatus, ok, queryParam } from "@/libraries/Http";
import { PackageCreateUseCase } from "@/app/sass/useCases/package/PackageCreateUseCase";
import { PackageListUseCase } from "@/app/sass/useCases/package/PackageListUseCase";
import type { CreatePackageInput } from "@/app/sass/models/PackageModel";

export const runtime = "nodejs";

async function handleGet(request: NextRequest) {
  try {
    await connectDatabase();
    const params = request.nextUrl.searchParams;
    const items = await new PackageListUseCase().exec({
      filter: {
        q: queryParam(params, "filter[q]"),
        name: queryParam(params, "filter[name]"),
        type: queryParam(params, "filter[type]"),
      },
      sortProperty: queryParam(params, "sortProperty"),
      sortDirection: queryParam(params, "sortDirection"),
      offset: queryParam(params, "offset"),
      limit: queryParam(params, "limit"),
    });
    return ok(items);
  } catch (error: any) {
    return fail(error.message ?? "Failed to fetch packages.", getErrorStatus(error, 500));
  }
}

async function handlePost(request: NextRequest) {
  try {
    await connectDatabase();
    const payload = (await request.json()) as Partial<CreatePackageInput>;

    const item = await new PackageCreateUseCase().exec(payload as CreatePackageInput);
    return ok(item, 201);
  } catch (error: any) {
    return fail(error.message ?? "Failed to create package.", getErrorStatus(error, 500));
  }
}

export const GET = withAuthorization(handleGet, ["sass:package:list:list"]);
export const POST = withAuthorization(handlePost, ["sass:package:create:create"]);
