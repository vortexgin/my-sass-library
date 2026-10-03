import Joi from "joi";
import InvoiceModelFactory, { InvoiceModel, type Invoice } from "@/app/sass/models/InvoiceModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const getInvoiceSchema = Joi.object({
  uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export class InvoiceGetUseCase extends BaseUseCase<string, Invoice | null, string> {

  private invoiceData?: InvoiceModel | null;

  protected async preExec(uuid: string): Promise<string> {
    const validatedUuid = await this.validate<{ uuid: string }>(getInvoiceSchema, { uuid });

    await InvoiceModelFactory();
    this.invoiceData = await InvoiceModel.findOne({ where: { uuid: validatedUuid.uuid, deleted_at: null } });
    if (!this.invoiceData) {
      throw new NotFoundException("Invoice not found")
    }

    return validatedUuid.uuid;
  }

  protected async execute(): Promise<Invoice | null> {
    return InvoiceModel.toApi(this.invoiceData?.toJSON());
  }
}
