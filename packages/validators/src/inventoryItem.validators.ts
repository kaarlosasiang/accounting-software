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
    itemCode: z.string().min(1, "Item code is required"),
    itemName: z.string().min(1, "Item name is required"),
    description: z.string().optional(),
    category: categoryEnum,
    unit: unitEnum,
    quantityOnHand: z
      .number({ message: "Quantity on hand must be a number" })
      .min(0, "Quantity on hand cannot be negative"),
    reorderLevel: z
      .number({ message: "Reorder level must be a number" })
      .min(0, "Reorder level cannot be negative"),
    unitCost: z
      .number({ message: "Unit cost must be a number" })
      .gt(0, "Unit cost must be greater than 0"),
    sellingPrice: z
      .number({ message: "Selling price must be a number" })
      .gt(0, "Selling price must be greater than 0"),
    isActive: z.boolean(),
  })
  .refine((data) => data.sellingPrice >= data.unitCost, {
    path: ["sellingPrice"],
    message: "Selling price should be greater than or equal to unit cost",
  });

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export { inventoryItemSchema };
