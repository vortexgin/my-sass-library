import Joi from "joi";
import PackageModelFactory, { PackageModel } from "@/app/sass/models/PackageModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const deletePackageSchema = Joi.object({
  uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export class PackageDeleteUseCase extends BaseUseCase<string, boolean, string> {

  private packageData?: PackageModel | null;

  protected async preExec(uuid: string): Promise<string> {
    const validatedUuid = await this.validate<{ uuid: string }>(deletePackageSchema, { uuid });

    await PackageModelFactory();
    this.packageData = await PackageModel.findOne({ where: { uuid: validatedUuid.uuid, deleted_at: null } });
    if (!this.packageData) {
      throw new NotFoundException("Package not found")
    }

    return validatedUuid.uuid;
  }

  protected async execute(uuid: string): Promise<boolean> {
    await PackageModelFactory();
    const [affectedRows] = await PackageModel.update(
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
