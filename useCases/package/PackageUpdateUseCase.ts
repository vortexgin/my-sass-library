import Joi from "joi";
import PackageModelFactory, { PackageModel, type UpdatePackageInput, type Package } from "@/app/sass/models/PackageModel";
import { ensurePackageActionsExist, normalizePackageActions } from "@/app/sass/useCases/package/PackageCreateUseCase";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const packageActionSchema = Joi.object({
  action_id: Joi.string().uuid({ version: "uuidv4" }).required(),
  credit: Joi.number().integer().min(0).optional(),
});

const updatePackageSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).optional(),
  description: Joi.string().trim().allow("", null).max(255).optional(),
  type: Joi.string().valid("subscription", "transaction", "quota").optional(),
  duration_days: Joi.number().integer().min(1).allow(null).optional(),
  duration_description: Joi.string().trim().allow("", null).max(255).optional(),
  credit_quota: Joi.number().integer().min(0).allow(null).optional(),
  actions: Joi.array().items(packageActionSchema).optional(),
  status: Joi.string().valid("active", "inactive", "deleted").optional(),
}).min(1);

export class PackageUpdateUseCase extends BaseUseCase<string, Package, { uuid: string; input: UpdatePackageInput }> {

  private packageData?: PackageModel | null;

  protected async preExec(uuid: string, input: UpdatePackageInput): Promise<{ uuid: string; input: UpdatePackageInput }> {
    const validatedInput = await this.validate<UpdatePackageInput>(updatePackageSchema, input);

    await PackageModelFactory();
    this.packageData = await PackageModel.findOne({ where: { uuid, deleted_at: null } });
    if (!this.packageData) {
      throw new NotFoundException("Package not found")
    }

    return { uuid, input: validatedInput };
  }

  protected async execute(context: { uuid: string; input: UpdatePackageInput }): Promise<Package> {
    const { input } = context;
    await PackageModelFactory();
    const nextData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (typeof input.name === "string" && input.name.trim()) {
      nextData.name = input.name.trim();
    }

    if (typeof input.description === "string" || input.description === null) {
      nextData.description = typeof input.description === "string" ? input.description.trim() || null : null;
    }

    if (input.type) {
      nextData.type = input.type;
    }

    if (Object.prototype.hasOwnProperty.call(input, "duration_days")) {
      nextData.duration_days = input.duration_days ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(input, "credit_quota")) {
      nextData.credit_quota = input.credit_quota ?? null;
    }

    if (typeof input.duration_description === "string" || input.duration_description === null) {
      nextData.duration_description =
        typeof input.duration_description === "string" ? input.duration_description.trim() || null : null;
    }

    if (input.actions !== undefined) {
      await ensurePackageActionsExist(input.actions.map((entry) => entry.action_id));
      nextData.actions = normalizePackageActions(input.actions);
    }

    if (input.status) {
      nextData.status = input.status;
      if (input.status === "deleted") {
        nextData.deleted_at = new Date();
      } else {
        nextData.deleted_at = null;
      }
    }

    await this.packageData?.update(nextData);

    return PackageModel.toApi(this.packageData?.toJSON());
  }
}
