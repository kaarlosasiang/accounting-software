export interface InventoryItem {
  _id: string;
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
  quantityAsOfDate: Date | string;
  reorderLevel: number;
  unitCost: number;
  sellingPrice: number;
  inventoryAccountId:
    | string
    | { _id: string; accountCode: string; accountName: string };
  cogsAccountId:
    | string
    | { _id: string; accountCode: string; accountName: string };
  incomeAccountId:
    | string
    | { _id: string; accountCode: string; accountName: string };
  supplierId?: string;
  salesTaxEnabled: boolean;
  salesTaxRate?: number;
  purchaseTaxRate?: number;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Form-specific type for inventory items
 * - Excludes _id (added when creating/updating)
 * - Uses Date instead of Date | string for quantityAsOfDate
 * - Uses string only for account IDs (not objects)
 */
export type InventoryItemForm = Omit<
  InventoryItem,
  | "_id"
  | "quantityAsOfDate"
  | "inventoryAccountId"
  | "cogsAccountId"
  | "incomeAccountId"
  | "createdAt"
  | "updatedAt"
> & {
  quantityAsOfDate: Date;
  inventoryAccountId: string;
  cogsAccountId: string;
  incomeAccountId: string;
};

/**
 * Props for the InventoryItemForm component
 */
export interface InventoryItemFormProps {
  onSubmit?: (data: InventoryItemForm) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<InventoryItemForm & { _id?: string }>;
  submitButtonText?: string;
  cancelButtonText?: string;
}

export interface InventoryResponse {
  success: boolean;
  data: InventoryItem;
  message?: string;
  error?: string;
}

export interface InventoryListResponse {
  success: boolean;
  data: InventoryItem[];
  count: number;
  message?: string;
  error?: string;
}

export interface InventoryValueResponse {
  success: boolean;
  data: {
    totalValue: number;
  };
  message?: string;
  error?: string;
}
