import { DataTypes, Model } from "sequelize";
import { getSequelizeInstance } from "@/database/sequelize";

export type OrganizationStatus = "active" | "inactive" | "deleted";

export type Organization = {
  uuid: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  npwp: string | null;
  status: OrganizationStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateOrganizationInput = {
  name: string;
  address: string;
  email: string;
  phone: string;
  npwp?: string | null;
  status?: OrganizationStatus;
};

export type UpdateOrganizationInput = Partial<CreateOrganizationInput>;

export type OrganizationModelAttributes = Partial<Omit<Organization, "created_at" | "updated_at" | "deleted_at">> & {
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export type OrganizationModelCreationAttributes = Partial<OrganizationModelAttributes>;

export class OrganizationModel extends Model<OrganizationModelAttributes, OrganizationModelCreationAttributes> {
  declare uuid: string;
  declare name: string;
  declare address: string;
  declare email: string;
  declare phone: string;
  declare npwp: string | null;
  declare status: "active" | "inactive" | "deleted";
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;

  static toApi(organization: any): Organization {
    return {
      uuid: organization.uuid,
      name: organization.name,
      address: organization.address,
      email: organization.email,
      phone: organization.phone,
      npwp: organization.npwp ?? null,
      status: organization.status,
      created_at: organization.created_at ? new Date(organization.created_at).toISOString() : new Date().toISOString(),
      updated_at: organization.updated_at ? new Date(organization.updated_at).toISOString() : new Date().toISOString(),
      deleted_at: organization.deleted_at ? new Date(organization.deleted_at).toISOString() : null,
    };
  }
}

let organizationModelPromise: Promise<typeof OrganizationModel> | null = null;

export async function getOrganizationModel(): Promise<typeof OrganizationModel> {
  if ((OrganizationModel as any).initialized) {
    return OrganizationModel;
  }
  if (!organizationModelPromise) {
    organizationModelPromise = initOrganizationModel().catch((error) => {
      organizationModelPromise = null;
      throw error;
    });
  }
  return organizationModelPromise;
}

async function initOrganizationModel(): Promise<typeof OrganizationModel> {
  const sequelize = await getSequelizeInstance();

  {
    OrganizationModel.init(
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
        address: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(160),
          allowNull: false,
        },
        phone: {
          type: DataTypes.STRING(30),
          allowNull: false,
        },
        npwp: {
          type: DataTypes.STRING(30),
          allowNull: true,
          defaultValue: null,
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
        modelName: "Organization",
        tableName: "sass_organization",
        timestamps: false,
        underscored: true,
      },
    );

    (OrganizationModel as any).initialized = true;
  }
  return OrganizationModel;
}

export default async function OrganizationModelFactory() {
  return getOrganizationModel();
}
