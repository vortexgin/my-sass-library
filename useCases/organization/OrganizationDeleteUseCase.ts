import Joi from "joi";
import OrganizationModelFactory, { OrganizationModel } from "@/app/sass/models/OrganizationModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const deleteOrganizationSchema = Joi.object({
  uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export class OrganizationDeleteUseCase extends BaseUseCase<string, boolean, string> {

  private organizationData?: OrganizationModel | null;

  protected async preExec(uuid: string): Promise<string> {
    const validatedUuid = await this.validate<{ uuid: string }>(deleteOrganizationSchema, { uuid });

    await OrganizationModelFactory();
    this.organizationData = await OrganizationModel.findOne({ where: { uuid: validatedUuid.uuid, deleted_at: null } });
    if (!this.organizationData) {
      throw new NotFoundException("Organization not found")
    }

    return validatedUuid.uuid;
  }

  protected async execute(uuid: string): Promise<boolean> {
    await OrganizationModelFactory();
    const [affectedRows] = await OrganizationModel.update(
      {
        status: "deleted",
        deleted_at: new Date(),
        updated_at: new Date(),
      },
      {
        where: { uuid, deleted_at: null },
      },
    );

    return affectedRows > 0;
  }
}
