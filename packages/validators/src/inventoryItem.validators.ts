import { z } from "zod";

const categoryEnum = z.enum(["Food", "Non-Food"], {
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
  ],
  { message: "Invalid unit" }
);

const inventoryItemSchema = z
  .object({
    sku: z.string().min(1, "SKU is required"),
    itemName: z.string().min(1, "Item name is required"),
    description: z.string().optional(),
    category: categoryEnum,
    unit: unitEnum,
    quantityOnHand: z
      .number({ message: "Quantity on hand must be a number" })
      .min(0, "Quantity on hand cannot be negative"),
    quantityAsOfDate: z.date({
      message: "Quantity as of date is required",
    }),
    reorderLevel: z
      .number({ message: "Reorder level must be a number" })
      .min(0, "Reorder level cannot be negative"),
    unitCost: z
      .number({ message: "Unit cost must be a number" })
      .min(0, "Unit cost must be greater than or equal to 0"),
    sellingPrice: z
      .number({ message: "Selling price must be a number" })
      .min(0, "Selling price must be greater than or equal to 0"),
    isActive: z.boolean(),
    inventoryAccountId: z
      .string({ message: "Inventory account is required" })
      .regex(
        /^[a-fA-F0-9]{24}$/,
        "Inventory account ID must be a valid ObjectId"
      ),
    cogsAccountId: z
      .string({ message: "COGS account is required" })
      .regex(/^[a-fA-F0-9]{24}$/, "COGS account ID must be a valid ObjectId"),
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
  .refine((data) => data.sellingPrice >= data.unitCost, {
    path: ["sellingPrice"],
    message: "Selling price should be greater than or equal to unit cost",
  })
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
    }
  );

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export { inventoryItemSchema };
