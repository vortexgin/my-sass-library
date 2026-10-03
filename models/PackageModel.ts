import { DataTypes, Model } from "sequelize";
import { getSequelizeInstance } from "@/database/sequelize";

export type PackageType = "subscription" | "transaction" | "quota";
export type PackageStatus = "active" | "inactive" | "deleted";

export type PackageAction = {
  action_id: string;
  credit?: number;
};

export type Package = {
  uuid: string;
  name: string;
  description: string | null;
  type: PackageType;
  duration_days: number | null;
  duration_description: string | null;
  credit_quota: number | null;
  actions: PackageAction[];
  status: PackageStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreatePackageInput = {
  name: string;
  description?: string | null;
  type: PackageType;
  duration_days?: number | null;
  duration_description?: string | null;
  credit_quota?: number | null;
  actions?: PackageAction[];
  status?: PackageStatus;
};

export type UpdatePackageInput = Partial<CreatePackageInput>;

export type PackageModelAttributes = Partial<
  Omit<Package, "created_at" | "updated_at" | "deleted_at" | "actions">
> & {
  actions: PackageAction[];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export type PackageModelCreationAttributes = Partial<PackageModelAttributes>;

export class PackageModel extends Model<PackageModelAttributes, PackageModelCreationAttributes> {
  declare uuid: string;
  declare name: string;
  declare description: string | null;
  declare type: PackageType;
  declare duration_days: number | null;
  declare duration_description: string | null;
  declare credit_quota: number | null;
  declare actions: PackageAction[];
  declare status: PackageStatus;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;

  static toApi(item: any): Package {
    return {
      uuid: item.uuid,
      name: item.name,
      description: item.description ?? null,
      type: item.type,
      duration_days: typeof item.duration_days === "number" ? item.duration_days : null,
      duration_description: item.duration_description ?? null,
      credit_quota: typeof item.credit_quota === "number" ? item.credit_quota : null,
      actions: Array.isArray(item.actions) ? item.actions : [],
      status: item.status,
      created_at: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
      updated_at: item.updated_at ? new Date(item.updated_at).toISOString() : new Date().toISOString(),
      deleted_at: item.deleted_at ? new Date(item.deleted_at).toISOString() : null,
    };
  }
}

let packageModelPromise: Promise<typeof PackageModel> | null = null;

export async function getPackageModel(): Promise<typeof PackageModel> {
  if ((PackageModel as any).initialized) {
    return PackageModel;
  }
  if (!packageModelPromise) {
    packageModelPromise = initPackageModel().catch((error) => {
      packageModelPromise = null;
      throw error;
    });
  }
  return packageModelPromise;
}

async function initPackageModel(): Promise<typeof PackageModel> {
  const sequelize = await getSequelizeInstance();

  {
    PackageModel.init(
      {
        uuid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(120),
          allowNull: false,
        },
        description: {
          type: DataTypes.STRING(255),
          allowNull: true,
          defaultValue: null,
        },
        type: {
          type: DataTypes.ENUM("subscription", "transaction", "quota"),
          allowNull: false,
        },
        duration_days: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: null,
        },
        duration_description: {
          type: DataTypes.STRING(255),
          allowNull: true,
          defaultValue: null,
        },
        credit_quota: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: null,
        },
        actions: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
        },
        status: {
          type: DataTypes.ENUM("active", "inactive", "deleted"),
          allowNull: false,
          defaultValue: "active",
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
        },
      },
      {
        sequelize,
        modelName: "Package",
        tableName: "sass_package",
        timestamps: false,
        underscored: true,
      },
    );

    (PackageModel as any).initialized = true;
  }
  return PackageModel;
}

export default async function PackageModelFactory() {
  return getPackageModel();
}
