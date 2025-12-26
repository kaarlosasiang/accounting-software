export interface InventoryItemForm {
  itemCode: string;
  itemName: string;
  description: string;
  category: string;
  unit: string;
  quantityOnHand: number;
  reorderLevel: number;
  unitCost: number;
  sellingPrice: number;
  inventoryAccountId: string;
  cogsAccountId: string;
  incomeAccountId: string;
  isActive: boolean;
}

export interface InventoryItemFormProps {
  onSubmit?: (data: InventoryItemForm) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<InventoryItemForm>;
  submitButtonText?: string;
  cancelButtonText?: string;
}
