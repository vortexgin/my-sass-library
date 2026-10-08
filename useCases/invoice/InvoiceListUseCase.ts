import Joi from "joi";
import { Op } from "sequelize";
import InvoiceModelFactory, { type Invoice } from "@/app/sass/models/InvoiceModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";

export type ListInvoicesFilter = {
  status?: string;
  sales_order_id?: string;
};

export type ListInvoicesInput = {
  filter?: ListInvoicesFilter;
  sortProperty?: string;
  sortDirection?: string;
  offset?: unknown;
  limit?: unknown;
};

export type ListInvoicesQuery = {
  status?: string;
  sales_order_id?: string;
  sortProperty: string;
  sortDirection: "ASC" | "DESC";
  offset: number;
  limit: number;
};

const SORTABLE_COLUMNS: Record<string, string> = {
  uuid: "uuid",
  start_date: "start_date",
  end_date: "end_date",
  status: "status",
  created_at: "created_at",
  updated_at: "updated_at",
};

const listInvoicesSchema = Joi.object({
  filter: Joi.object({
    status: Joi.string().valid("running", "active", "inactive", "paid", "deleted").optional(),
    sales_order_id: Joi.string().uuid({ version: "uuidv4" }).optional(),
  }).optional(),
  sortProperty: Joi.string()
    .valid(...Object.keys(SORTABLE_COLUMNS))
    .insensitive()
    .default("created_at"),
  sortDirection: Joi.string().valid("asc", "desc").insensitive().default("desc"),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export class InvoiceListUseCase extends BaseUseCase<ListInvoicesInput | void, Invoice[], ListInvoicesQuery> {
  protected async preExec(input?: ListInvoicesInput | void): Promise<ListInvoicesQuery> {
    const validated = await this.validate<{
      filter?: ListInvoicesFilter;
      sortProperty: string;
      sortDirection: string;
      offset: number;
      limit: number;
    }>(listInvoicesSchema, input ?? {});
    const filter = validated.filter ?? {};

    return {
      status: filter.status || undefined,
      sales_order_id: filter.sales_order_id || undefined,
      sortProperty: SORTABLE_COLUMNS[validated.sortProperty.toLowerCase()] ?? "created_at",
      sortDirection: validated.sortDirection.toUpperCase() as "ASC" | "DESC",
      offset: validated.offset,
      limit: validated.limit,
    };
  }

  protected async execute(context: ListInvoicesQuery): Promise<Invoice[]> {
    const InvoiceModel = await InvoiceModelFactory();
    const conditions: Record<string, unknown>[] = [{ deleted_at: null }];

    if (context.status) {
      conditions.push({ status: context.status });
    }

    if (context.sales_order_id) {
      conditions.push({ sales_order_id: context.sales_order_id });
    }

    const invoices = await InvoiceModel.findAll({
      where: { [Op.and]: conditions },
      order: [[context.sortProperty, context.sortDirection]],
      offset: context.offset,
      limit: context.limit,
    });

    return invoices.map((invoice) => InvoiceModel.toApi(invoice.toJSON()));
  }
}
