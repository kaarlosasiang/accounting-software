import { z } from "zod";

const itemTypeEnum = z.enum(["Product", "Service"], {
  message: "Invalid item type",
});

const categoryEnum = z.enum(["Food", "Non-Food", "Service"], {
  message: "Invalid category",
});

const unitEnum = z.enum(
  [
    "pcs",
    "kg",
    "sack",
    "box",
    "pack",
    "bottle",
    "can",
    "set",
    "bundle",
    "liter",
    "hour",
    "session",
    "service",
  ],
  { message: "Invalid unit" },
);

const inventoryItemSchema = z
  .object({
    itemType: itemTypeEnum.default("Product"),
    sku: z.string().min(1, "SKU is required"),
    itemName: z.string().min(1, "Item name is required"),
    description: z.string().optional(),
    category: categoryEnum,
    unit: unitEnum,
    quantityOnHand: z
      .number({ message: "Quantity on hand must be a number" })
      .min(0, "Quantity on hand cannot be negative")
      .optional()
      .default(0),
    quantityAsOfDate: z.coerce
      .date({
        message: "Quantity as of date is required",
      })
      .optional(),
    reorderLevel: z
      .number({ message: "Reorder level must be a number" })
      .min(0, "Reorder level cannot be negative")
      .optional()
      .default(0),
    unitCost: z
      .number({ message: "Unit cost must be a number" })
      .min(0, "Unit cost must be greater than or equal to 0")
      .optional()
      .default(0),
    sellingPrice: z
      .number({ message: "Selling price must be a number" })
      .min(0, "Selling price must be greater than or equal to 0"),
    isActive: z.boolean(),
    inventoryAccountId: z
      .string()
      .regex(
        /^[a-fA-F0-9]{24}$/,
        "Inventory account ID must be a valid ObjectId",
      )
      .optional()
      .or(z.literal("").transform(() => undefined)),
    cogsAccountId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, "COGS account ID must be a valid ObjectId")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    incomeAccountId: z
      .string({ message: "Income account is required" })
      .regex(/^[a-fA-F0-9]{24}$/, "Income account ID must be a valid ObjectId"),
    supplierId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, "Supplier ID must be a valid ObjectId")
      .optional(),
    salesTaxEnabled: z.boolean(),
    salesTaxRate: z
      .number()
      .min(0, "Sales tax rate cannot be negative")
      .max(100, "Sales tax rate cannot exceed 100%")
      .optional(),
    purchaseTaxRate: z
      .number()
      .min(0, "Purchase tax rate cannot be negative")
      .max(100, "Purchase tax rate cannot exceed 100%")
      .optional(),
  })
  .refine(
    (data) => {
      // For products, require inventory-related fields
      if (data.itemType === "Product") {
        return (
          data.quantityOnHand !== undefined &&
          data.quantityAsOfDate !== undefined &&
          data.reorderLevel !== undefined &&
          data.inventoryAccountId !== undefined &&
          data.cogsAccountId !== undefined
        );
      }
      return true;
    },
    {
      message: "Products require inventory tracking fields",
      path: ["itemType"],
    },
  )
  .refine(
    (data) => {
      // Only validate selling price vs unit cost for products with unitCost
      if (data.unitCost !== undefined && data.unitCost > 0) {
        return data.sellingPrice >= data.unitCost;
      }
      return true;
    },
    {
      path: ["sellingPrice"],
      message: "Selling price should be greater than or equal to unit cost",
    },
  )
  .refine(
    (data) => {
      if (data.salesTaxEnabled && !data.salesTaxRate) {
        return false;
      }
      return true;
    },
    {
      path: ["salesTaxRate"],
      message: "Sales tax rate is required when sales tax is enabled",
    },
  );

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export { inventoryItemSchema };
