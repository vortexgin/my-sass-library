import { randomUUID } from "crypto";
import Joi from "joi";
import OrganizationModelFactory, { OrganizationModel, type CreateOrganizationInput, type Organization } from "@/app/sass/models/OrganizationModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";

const createOrganizationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  address: Joi.string().trim().min(5).max(255).required(),
  email: Joi.string().trim().email().max(160).required(),
  phone: Joi.string().trim().min(6).max(30).required(),
  npwp: Joi.string().trim().allow("", null).max(30).optional(),
  status: Joi.string().valid("active", "inactive", "deleted").optional(),
});

export class OrganizationCreateUseCase extends BaseUseCase<CreateOrganizationInput, Organization, CreateOrganizationInput> {
  protected async preExec(input: CreateOrganizationInput): Promise<CreateOrganizationInput> {
    return this.validate<CreateOrganizationInput>(createOrganizationSchema, input);
  }

  protected async execute(input: CreateOrganizationInput): Promise<Organization> {
    await OrganizationModelFactory();
    const organization = await OrganizationModel.create({
      uuid: randomUUID(),
      name: input.name?.trim(),
      address: input.address?.trim(),
      email: input.email?.trim().toLowerCase(),
      phone: input.phone?.trim(),
      npwp: input.npwp?.trim() || null,
      status: input.status ?? "active",
      deleted_at: null,
    });

    return OrganizationModel.toApi(organization.toJSON());
  }
}
