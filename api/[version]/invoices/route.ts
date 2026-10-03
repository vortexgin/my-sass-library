import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { withEncryption } from "@/libraries/EncryptedRoute";
import { fail, getErrorStatus, ok, queryParam } from "@/libraries/Http";
import { InvoiceListUseCase } from "@/app/sass/useCases/invoice/InvoiceListUseCase";

export const runtime = "nodejs";

async function handleGet(request: NextRequest) {
  try {
    await connectDatabase();
    const params = request.nextUrl.searchParams;
    const invoices = await new InvoiceListUseCase().exec({
      filter: {
        status: queryParam(params, "filter[status]"),
      },
      sortProperty: queryParam(params, "sortProperty"),
      sortDirection: queryParam(params, "sortDirection"),
      offset: queryParam(params, "offset"),
      limit: queryParam(params, "limit"),
    });
    return ok(invoices);
  } catch (error: any) {
    return fail(error.message ?? "Failed to fetch invoices.", getErrorStatus(error, 500));
  }
}

export const GET = withAuthorization(withEncryption(handleGet), ["authorized"]);
