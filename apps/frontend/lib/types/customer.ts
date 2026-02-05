/**
 * Address interface for customers
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Customer entity type (from API)
 */
export interface Customer {
  _id: string;
  customerCode: string;
  customerName: string;
  displayName: string;
  email: string;
  phone: string;
  website?: string | null;
  billingAddress: Address;
  shippingAddress?: Address | null;
  taxId: string;
  paymentTerms: string;
  creditLimit: number;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  notes?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // Virtual fields
  fullBillingAddress?: string;
  fullShippingAddress?: string;
  availableCredit?: number;
}

/**
 * Form-specific type for customers
 * - Excludes _id, currentBalance, createdAt, updatedAt, virtual fields
 */
export type CustomerForm = Omit<
  Customer,
  | "_id"
  | "currentBalance"
  | "createdAt"
  | "updatedAt"
  | "fullBillingAddress"
  | "fullShippingAddress"
  | "availableCredit"
>;

/**
 * Props for the CustomerForm component
 */
export interface CustomerFormProps {
  onSubmit?: (data: CustomerForm) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<CustomerForm & { _id?: string }>;
  submitButtonText?: string;
  cancelButtonText?: string;
}

/**
 * API Response types
 */
export interface CustomerResponse {
  success: boolean;
  data: Customer;
  message?: string;
  error?: string;
}

export interface CustomerListResponse {
  success: boolean;
  data: Customer[];
  count: number;
  message?: string;
  error?: string;
}

/**
 * Credit check response
 */
export interface CreditCheckResponse {
  success: boolean;
  data: {
    hasCredit: boolean;
    creditLimit: number;
    currentBalance: number;
    availableCredit: number;
    requestedAmount: number;
  };
  message?: string;
  error?: string;
}
