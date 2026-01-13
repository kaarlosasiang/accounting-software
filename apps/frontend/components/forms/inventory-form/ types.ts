export interface InventoryItemForm {
  sku: string;
  itemName: string;
  description?: string;
  category: "Food" | "Non-Food";
  unit:
    | "pcs"
    | "kg"
    | "sack"
    | "box"
    | "pack"
    | "bottle"
    | "can"
    | "set"
    | "bundle"
    | "liter";
  quantityOnHand: number;
  quantityAsOfDate: Date;
  reorderLevel: number;
  unitCost: number;
  sellingPrice: number;
  inventoryAccountId: string;
  cogsAccountId: string;
  incomeAccountId: string;
  supplierId?: string;
  salesTaxEnabled: boolean;
  salesTaxRate?: number;
  purchaseTaxRate?: number;
  isActive: boolean;
}

export interface InventoryItemFormProps {
  onSubmit?: (data: InventoryItemForm) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<InventoryItemForm>;
  submitButtonText?: string;
  cancelButtonText?: string;
}
