/**
 * Address interface for suppliers
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Supplier entity type (from API)
 */
export interface Supplier {
  _id: string;
  supplierCode: string;
  supplierName: string;
  displayName?: string;
  email: string;
  phone: string;
  website?: string;
  address: Address;
  taxId: string;
  paymentTerms: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Form-specific type for suppliers
 * - Excludes _id, currentBalance, createdAt, updatedAt
 */
export type SupplierForm = Omit<
  Supplier,
  "_id" | "currentBalance" | "createdAt" | "updatedAt"
>;

/**
 * Props for the SupplierForm component
 */
export interface SupplierFormProps {
  onSubmit?: (data: SupplierForm) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<SupplierForm & { _id?: string }>;
  submitButtonText?: string;
  cancelButtonText?: string;
}

/**
 * API Response types
 */
export interface SupplierResponse {
  success: boolean;
  data: Supplier;
  message?: string;
  error?: string;
}

export interface SupplierListResponse {
  success: boolean;
  data: Supplier[];
  count: number;
  message?: string;
  error?: string;
}
