import Joi from "joi";
import { Op } from "sequelize";
import PackageModelFactory, { type Package } from "@/app/sass/models/PackageModel";
import { escapeLike } from "@/libraries/String";
import { BaseUseCase } from "@/useCases/BaseUseCase";

export type ListPackagesFilter = {
  q?: string;
  name?: string;
  type?: string;
};

export type ListPackagesInput = {
  filter?: ListPackagesFilter;
  sortProperty?: string;
  sortDirection?: string;
  offset?: unknown;
  limit?: unknown;
};

export type ListPackagesQuery = {
  q?: string;
  name?: string;
  type?: string;
  sortProperty: string;
  sortDirection: "ASC" | "DESC";
  offset: number;
  limit: number;
};

const SORTABLE_COLUMNS: Record<string, string> = {
  uuid: "uuid",
  name: "name",
  type: "type",
  duration_days: "duration_days",
  credit_quota: "credit_quota",
  status: "status",
  created_at: "created_at",
  updated_at: "updated_at",
};

const listPackagesSchema = Joi.object({
  filter: Joi.object({
    q: Joi.string().trim().allow("").optional(),
    name: Joi.string().trim().allow("").optional(),
    type: Joi.string().valid("subscription", "transaction", "quota").optional(),
  }).optional(),
  sortProperty: Joi.string()
    .valid(...Object.keys(SORTABLE_COLUMNS))
    .insensitive()
    .default("created_at"),
  sortDirection: Joi.string().valid("asc", "desc").insensitive().default("desc"),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export class PackageListUseCase extends BaseUseCase<ListPackagesInput | void, Package[], ListPackagesQuery> {
  protected async preExec(input?: ListPackagesInput | void): Promise<ListPackagesQuery> {
    const validated = await this.validate<{
      filter?: ListPackagesFilter;
      sortProperty: string;
      sortDirection: string;
      offset: number;
      limit: number;
    }>(listPackagesSchema, input ?? {});
    const filter = validated.filter ?? {};

    return {
      q: filter.q?.trim() || undefined,
      name: filter.name?.trim() || undefined,
      type: filter.type || undefined,
      sortProperty: SORTABLE_COLUMNS[validated.sortProperty.toLowerCase()] ?? "created_at",
      sortDirection: validated.sortDirection.toUpperCase() as "ASC" | "DESC",
      offset: validated.offset,
      limit: validated.limit,
    };
  }

  protected async execute(context: ListPackagesQuery): Promise<Package[]> {
    const PackageModel = await PackageModelFactory();
    const conditions: Record<string, unknown>[] = [{ deleted_at: null }];

    if (context.type) {
      conditions.push({ type: context.type });
    }

    if (context.name) {
      conditions.push({ name: { [Op.iLike]: `%${escapeLike(context.name)}%` } });
    }

    if (context.q) {
      const pattern = `%${escapeLike(context.q)}%`;
      conditions.push({
        [Op.or]: [{ name: { [Op.iLike]: pattern } }, { description: { [Op.iLike]: pattern } }],
      });
    }

    const items = await PackageModel.findAll({
      where: { [Op.and]: conditions },
      order: [[context.sortProperty, context.sortDirection]],
      offset: context.offset,
      limit: context.limit,
    });

    return items.map((item) => PackageModel.toApi(item.toJSON()));
  }
}
