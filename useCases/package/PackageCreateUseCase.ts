import { randomUUID } from "crypto";
import Joi, { Schema } from "joi";
import { Op } from "sequelize";
import PackageModelFactory, { PackageModel, type CreatePackageInput, type Package, type PackageAction } from "@/app/sass/models/PackageModel";
import ActionModelFactory, { ActionModel } from "@/app/base/models/ActionModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const packageActionSchema = Joi.object({
  action_id: Joi.string().uuid({ version: "uuidv4" }).required(),
  credit: Joi.number().integer().min(0).optional(),
});

const createPackageSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().allow("", null).max(255).optional(),
  type: Joi.string().valid("subscription", "transaction", "quota").required(),
  duration_days: Joi.number().integer().min(1).allow(null).optional(),
  duration_description: Joi.string().trim().allow("", null).max(255).optional(),
  credit_quota: Joi.number().integer().min(0).allow(null).optional(),
  actions: Joi.array().items(packageActionSchema).optional(),
  status: Joi.string().valid("active", "inactive", "deleted").optional(),
});

export function normalizePackageActions(actions?: PackageAction[]): PackageAction[] {
  const seen = new Set<string>();
  const normalized: PackageAction[] = [];
  for (const entry of actions ?? []) {
    if (!entry || typeof entry.action_id !== "string" || seen.has(entry.action_id)) {
      continue;
    }
    seen.add(entry.action_id);
    normalized.push(
      typeof entry.credit === "number" ? { action_id: entry.action_id, credit: entry.credit } : { action_id: entry.action_id },
    );
  }
  return normalized;
}

export async function ensurePackageActionsExist(actionIds: string[]): Promise<void> {
  if (actionIds.length === 0) {
    return;
  }

  await ActionModelFactory();
  const actions = await ActionModel.findAll({
    where: { uuid: { [Op.in]: [...new Set(actionIds)] }, deleted_at: null },
  });
  if (actions.length !== new Set(actionIds).size) {
    throw new NotFoundException("Action not found.");
  }
}

export class PackageCreateUseCase extends BaseUseCase<CreatePackageInput, Package, CreatePackageInput> {
  protected async preExec(input: CreatePackageInput): Promise<CreatePackageInput> {
    return this.validate<CreatePackageInput>(createPackageSchema, input);
  }

  protected async validate<TValidated = CreatePackageInput>(schema: Schema, input: CreatePackageInput): Promise<TValidated> {
    const validatedInput = await super.validate<TValidated>(schema, input);
    await ensurePackageActionsExist((input.actions ?? []).map((entry) => entry.action_id));
    return validatedInput;
  }

  protected async execute(input: CreatePackageInput): Promise<Package> {
    await PackageModelFactory();
    const item = await PackageModel.create({
      uuid: randomUUID(),
      name: input.name?.trim(),
      description: input.description?.trim() || null,
      type: input.type,
      duration_days: input.duration_days ?? null,
      duration_description: input.duration_description?.trim() || null,
      credit_quota: input.credit_quota ?? null,
      actions: normalizePackageActions(input.actions),
      status: input.status ?? "active",
      deleted_at: null,
    });

    return PackageModel.toApi(item.toJSON());
  }
}
