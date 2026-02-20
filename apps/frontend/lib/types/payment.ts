export interface PaymentAllocation {
  documentId: string;
  documentNumber: string;
  allocatedAmount: number;
  documentType: "INVOICE" | "BILL";
  invoiceBalance?: number;
  remainingBalance?: number;
}

export interface Payment {
  _id: string;
  companyId: string;
  paymentNumber: string;
  paymentDate: string;
  paymentType: "RECEIVED" | "MADE";
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CHECK" | "CREDIT_CARD" | "ONLINE";
  referenceNumber: string;
  amount: number;
  allocations: PaymentAllocation[];
  customerId?: string;
  supplierId?: string;
  bankAccountId?: string;
  notes?: string;
  journalEntryId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    _id: string;
    customerName: string;
    displayName: string;
    email: string;
  };
  supplier?: {
    _id: string;
    supplierName: string;
    email: string;
  };
  bankAccount?: {
    _id: string;
    accountCode: string;
    accountName: string;
  };
  creator?: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface PaymentFormData {
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  amount: number;
  bankAccountId: string;
  notes?: string;
  allocations: PaymentAllocation[];
}

export interface PaymentSuggestion {
  allocations: PaymentAllocation[];
  remainingBalance: number;
  totalAllocated: number;
}

export interface PaymentSuggestionResponse {
  success: boolean;
  data: PaymentSuggestion;
}

export interface PaymentSummary {
  payment: Payment;
  invoicesUpdated?: number;
  billsUpdated?: number;
  customerNewBalance?: number;
  supplierNewBalance?: number;
}
