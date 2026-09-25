import Joi from "joi";
import { Op } from "sequelize";
import OrganizationModelFactory, { type Organization } from "@/app/sass/models/OrganizationModel";
import { escapeLike } from "@/libraries/String";
import { BaseUseCase } from "@/useCases/BaseUseCase";

export type ListOrganizationsFilter = {
  q?: string;
  name?: string;
  email?: string;
};

export type ListOrganizationsInput = {
  filter?: ListOrganizationsFilter;
  sortProperty?: string;
  sortDirection?: string;
  offset?: unknown;
  limit?: unknown;
};

export type ListOrganizationsQuery = {
  q?: string;
  name?: string;
  email?: string;
  sortProperty: string;
  sortDirection: "ASC" | "DESC";
  offset: number;
  limit: number;
};

const SORTABLE_COLUMNS: Record<string, string> = {
  uuid: "uuid",
  name: "name",
  address: "address",
  email: "email",
  phone: "phone",
  npwp: "npwp",
  status: "status",
  created_at: "created_at",
  updated_at: "updated_at",
};

const listOrganizationsSchema = Joi.object({
  filter: Joi.object({
    q: Joi.string().trim().allow("").optional(),
    name: Joi.string().trim().allow("").optional(),
    email: Joi.string().trim().allow("").optional(),
  }).optional(),
  sortProperty: Joi.string()
    .valid(...Object.keys(SORTABLE_COLUMNS))
    .insensitive()
    .default("created_at"),
  sortDirection: Joi.string().valid("asc", "desc").insensitive().default("desc"),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export class OrganizationListUseCase extends BaseUseCase<ListOrganizationsInput | void, Organization[], ListOrganizationsQuery> {
  protected async preExec(input?: ListOrganizationsInput | void): Promise<ListOrganizationsQuery> {
    const validated = await this.validate<{
      filter?: ListOrganizationsFilter;
      sortProperty: string;
      sortDirection: string;
      offset: number;
      limit: number;
    }>(listOrganizationsSchema, input ?? {});
    const filter = validated.filter ?? {};

    return {
      q: filter.q?.trim() || undefined,
      name: filter.name?.trim() || undefined,
      email: filter.email?.trim().toLowerCase() || undefined,
      sortProperty: SORTABLE_COLUMNS[validated.sortProperty.toLowerCase()] ?? "created_at",
      sortDirection: validated.sortDirection.toUpperCase() as "ASC" | "DESC",
      offset: validated.offset,
      limit: validated.limit,
    };
  }

  protected async execute(context: ListOrganizationsQuery): Promise<Organization[]> {
    const OrganizationModel = await OrganizationModelFactory();
    const conditions: Record<string, unknown>[] = [{ deleted_at: null }];

    if (context.email) {
      conditions.push({ email: context.email });
    }

    if (context.name) {
      conditions.push({ name: { [Op.iLike]: `%${escapeLike(context.name)}%` } });
    }

    if (context.q) {
      const pattern = `%${escapeLike(context.q)}%`;
      conditions.push({
        [Op.or]: [
          { name: { [Op.iLike]: pattern } },
          { email: { [Op.iLike]: pattern } },
          { phone: { [Op.iLike]: pattern } },
          { npwp: { [Op.iLike]: pattern } },
        ],
      });
    }

    const organizations = await OrganizationModel.findAll({
      where: { [Op.and]: conditions },
      order: [[context.sortProperty, context.sortDirection]],
      offset: context.offset,
      limit: context.limit,
    });

    return organizations.map((organization) => OrganizationModel.toApi(organization.toJSON()));
  }
}
