import { DataTypes, Model } from "sequelize";
import { getSequelizeInstance } from "@/database/sequelize";

export type InvoiceStatus = "running" | "active" | "inactive" | "paid" | "deleted";

export type InvoiceOrganization = {
  id: string;
  name: string;
  npwp: string | null;
};

export type InvoicePackage = {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
};

export type Invoice = {
  uuid: string;
  organization: InvoiceOrganization;
  package: InvoicePackage;
  sales_order_id: string | null;
  sales_order_number: string | null;
  start_date: string | null;
  end_date: string | null;
  credit_limit: number | null;
  credit_usage: number;
  status: InvoiceStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type InvoiceModelAttributes = {
  uuid: string;
  organization: InvoiceOrganization;
  package: InvoicePackage;
  sales_order_id: string | null;
  sales_order_number: string | null;
  start_date: string | null;
  end_date: string | null;
  credit_limit: number | null;
  credit_usage: number;
  status: InvoiceStatus;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export type InvoiceModelCreationAttributes = Partial<InvoiceModelAttributes>;

export class InvoiceModel extends Model<InvoiceModelAttributes, InvoiceModelCreationAttributes> {
  declare uuid: string;
  declare organization: InvoiceOrganization;
  declare package: InvoicePackage;
  declare sales_order_id: string | null;
  declare sales_order_number: string | null;
  declare start_date: string | null;
  declare end_date: string | null;
  declare credit_limit: number | null;
  declare credit_usage: number;
  declare status: InvoiceStatus;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;

  static toApi(invoice: any): Invoice {
    return {
      uuid: invoice.uuid,
      organization: {
        id: invoice.organization?.id ?? "",
        name: invoice.organization?.name ?? "",
        npwp: invoice.organization?.npwp ?? null,
      },
      package: {
        id: invoice.package?.id ?? "",
        name: invoice.package?.name ?? "",
        description: invoice.package?.description ?? null,
        type: invoice.package?.type ?? null,
      },
      start_date: invoice.start_date ?? null,
      end_date: invoice.end_date ?? null,
      // Null on old DBs (pre SO-link migration): read tolerantly.
      sales_order_id: typeof invoice.sales_order_id === "string" ? invoice.sales_order_id : null,
      sales_order_number: typeof invoice.sales_order_number === "string" ? invoice.sales_order_number : null,
      credit_limit: typeof invoice.credit_limit === "number" ? invoice.credit_limit : null,
      credit_usage: typeof invoice.credit_usage === "number" ? invoice.credit_usage : 0,
      status: invoice.status,
      created_at: invoice.created_at ? new Date(invoice.created_at).toISOString() : new Date().toISOString(),
      updated_at: invoice.updated_at ? new Date(invoice.updated_at).toISOString() : new Date().toISOString(),
      deleted_at: invoice.deleted_at ? new Date(invoice.deleted_at).toISOString() : null,
    };
  }
}

let invoiceModelPromise: Promise<typeof InvoiceModel> | null = null;

export async function getInvoiceModel(): Promise<typeof InvoiceModel> {
  if ((InvoiceModel as any).initialized) {
    return InvoiceModel;
  }
  if (!invoiceModelPromise) {
    invoiceModelPromise = initInvoiceModel().catch((error) => {
      invoiceModelPromise = null;
      throw error;
    });
  }
  return invoiceModelPromise;
}

async function initInvoiceModel(): Promise<typeof InvoiceModel> {
  const sequelize = await getSequelizeInstance();

  {
    InvoiceModel.init(
      {
        uuid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        organization: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        package: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        sales_order_id: {
          type: DataTypes.UUID,
          allowNull: true,
          defaultValue: null,
        },
        sales_order_number: {
          type: DataTypes.STRING(60),
          allowNull: true,
          defaultValue: null,
        },
        start_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          defaultValue: null,
        },
        end_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          defaultValue: null,
        },
        credit_limit: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: null,
        },
        credit_usage: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        status: {
          type: DataTypes.ENUM("running", "active", "inactive", "paid", "deleted"),
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
        modelName: "Invoice",
        tableName: "sass_invoice",
        timestamps: false,
        underscored: true,
      },
    );

    (InvoiceModel as any).initialized = true;
  }
  return InvoiceModel;
}

export default async function InvoiceModelFactory() {
  return getInvoiceModel();
}
