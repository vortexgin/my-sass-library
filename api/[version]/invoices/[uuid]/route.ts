import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { withEncryption } from "@/libraries/EncryptedRoute";
import { fail, getErrorStatus, ok } from "@/libraries/Http";
import { InvoiceGetUseCase } from "@/app/sass/useCases/invoice/InvoiceGetUseCase";

export const runtime = "nodejs";

async function handleGet(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const invoice = await new InvoiceGetUseCase().exec(uuid);

    return ok(invoice);
  } catch (error: any) {
    return fail(error.message ?? "Failed to fetch invoice.", getErrorStatus(error, 500));
  }
}

export const GET = withAuthorization(withEncryption(handleGet), ["authorized"]);
