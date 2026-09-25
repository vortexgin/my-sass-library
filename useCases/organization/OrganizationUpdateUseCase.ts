import Joi from "joi";
import OrganizationModelFactory, { OrganizationModel, type UpdateOrganizationInput, type Organization } from "@/app/sass/models/OrganizationModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const updateOrganizationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).optional(),
  address: Joi.string().trim().min(5).max(255).optional(),
  email: Joi.string().trim().email().max(160).optional(),
  phone: Joi.string().trim().min(6).max(30).optional(),
  npwp: Joi.string().trim().allow("", null).max(30).optional(),
  status: Joi.string().valid("active", "inactive", "deleted").optional(),
}).min(1);

export class OrganizationUpdateUseCase extends BaseUseCase<string, Organization, { uuid: string; input: UpdateOrganizationInput }> {

  private organizationData?: OrganizationModel | null;

  protected async preExec(uuid: string, input: UpdateOrganizationInput): Promise<{ uuid: string; input: UpdateOrganizationInput }> {
    const validatedInput = await this.validate<UpdateOrganizationInput>(updateOrganizationSchema, input);

    await OrganizationModelFactory();
    this.organizationData = await OrganizationModel.findOne({ where: { uuid, deleted_at: null } });
    if (!this.organizationData) {
      throw new NotFoundException("Organization not found")
    }

    return { uuid, input: validatedInput };
  }

  protected async execute(context: { uuid: string; input: UpdateOrganizationInput }): Promise<Organization> {
    const { input } = context;
    await OrganizationModelFactory();
    const nextData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (typeof input.name === "string" && input.name.trim()) {
      nextData.name = input.name.trim();
    }

    if (typeof input.address === "string" && input.address.trim()) {
      nextData.address = input.address.trim();
    }

    if (typeof input.email === "string" && input.email.trim()) {
      nextData.email = input.email.trim().toLowerCase();
    }

    if (typeof input.phone === "string" && input.phone.trim()) {
      nextData.phone = input.phone.trim();
    }

    if (typeof input.npwp === "string" || input.npwp === null) {
      nextData.npwp = typeof input.npwp === "string" ? input.npwp.trim() || null : null;
    }

    if (input.status) {
      nextData.status = input.status;
      if (input.status === "deleted") {
        nextData.deleted_at = new Date();
      } else {
        nextData.deleted_at = null;
      }
    }

    await this.organizationData?.update(nextData);

    return OrganizationModel.toApi(this.organizationData?.toJSON());
  }
}
