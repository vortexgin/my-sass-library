import Joi from "joi";
import PackageModelFactory, { PackageModel, type Package } from "@/app/sass/models/PackageModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const getPackageSchema = Joi.object({
  uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export class PackageGetUseCase extends BaseUseCase<string, Package | null, string> {

  private packageData?: PackageModel | null;

  protected async preExec(uuid: string): Promise<string> {
    const validatedUuid = await this.validate<{ uuid: string }>(getPackageSchema, { uuid });

    await PackageModelFactory();
    this.packageData = await PackageModel.findOne({ where: { uuid: validatedUuid.uuid, deleted_at: null } });
    if (!this.packageData) {
      throw new NotFoundException("Package not found")
    }

    return validatedUuid.uuid;
  }

  protected async execute(): Promise<Package | null> {
    return PackageModel.toApi(this.packageData?.toJSON());
  }
}
