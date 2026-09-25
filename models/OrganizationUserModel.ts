import { DataTypes, Model } from "sequelize";
import { getSequelizeInstance } from "@/database/sequelize";

export type OrganizationUserStatus = "active" | "inactive" | "deleted";

export type OrganizationUser = {
  uuid: string;
  organization_id: string;
  user_id: string;
  status: OrganizationUserStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type OrganizationUserModelAttributes = {
  uuid: string;
  organization_id: string;
  user_id: string;
  status: OrganizationUserStatus;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export type OrganizationUserModelCreationAttributes = Partial<OrganizationUserModelAttributes>;

export class OrganizationUserModel extends Model<
  OrganizationUserModelAttributes,
  OrganizationUserModelCreationAttributes
> {
  declare uuid: string;
  declare organization_id: string;
  declare user_id: string;
  declare status: OrganizationUserStatus;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
}

let organizationUserModelPromise: Promise<typeof OrganizationUserModel> | null = null;

export async function getOrganizationUserModel(): Promise<typeof OrganizationUserModel> {
  if ((OrganizationUserModel as any).initialized) {
    return OrganizationUserModel;
  }
  if (!organizationUserModelPromise) {
    organizationUserModelPromise = initOrganizationUserModel().catch((error) => {
      organizationUserModelPromise = null;
      throw error;
    });
  }
  return organizationUserModelPromise;
}

async function initOrganizationUserModel(): Promise<typeof OrganizationUserModel> {
  const sequelize = await getSequelizeInstance();

  {
    OrganizationUserModel.init(
      {
        uuid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        organization_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "sass_organization", key: "uuid" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          references: { model: "base_users", key: "uuid" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
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
        modelName: "OrganizationUser",
        tableName: "sass_organization_user",
        timestamps: false,
        underscored: true,
      },
    );

    const { getOrganizationModel } = await import("@/app/sass/models/OrganizationModel");
    const { getUserModel } = await import("@/app/base/models/UserModel");
    OrganizationUserModel.belongsTo(await getOrganizationModel(), {
      foreignKey: "organization_id",
      targetKey: "uuid",
      as: "organization",
    });
    OrganizationUserModel.belongsTo(await getUserModel(), {
      foreignKey: "user_id",
      targetKey: "uuid",
      as: "user",
    });

    (OrganizationUserModel as any).initialized = true;
  }
  return OrganizationUserModel;
}

export default async function OrganizationUserModelFactory() {
  return getOrganizationUserModel();
}
