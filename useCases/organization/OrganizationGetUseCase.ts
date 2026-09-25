import Joi from "joi";
import OrganizationModelFactory, { OrganizationModel, type Organization } from "@/app/sass/models/OrganizationModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const getOrganizationSchema = Joi.object({
  uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export class OrganizationGetUseCase extends BaseUseCase<string, Organization | null, string> {

  private organizationData?: OrganizationModel | null;

  protected async preExec(uuid: string): Promise<string> {
    const validatedUuid = await this.validate<{ uuid: string }>(getOrganizationSchema, { uuid });

    await OrganizationModelFactory();
    this.organizationData = await OrganizationModel.findOne({ where: { uuid: validatedUuid.uuid, deleted_at: null } });
    if (!this.organizationData) {
      throw new NotFoundException("Organization not found")
    }

    return validatedUuid.uuid;
  }

  protected async execute(): Promise<Organization | null> {
    return OrganizationModel.toApi(this.organizationData?.toJSON());
  }
}
