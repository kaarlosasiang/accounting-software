import { apiFetch } from "@/lib/config/api-client";

export interface BillLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  accountId: string;
  inventoryItemId?: string;
  amount: number;
}

export interface Bill {
  _id: string;
  companyId: string;
  supplierId: {
    _id: string;
    supplierName: string;
    displayName: string;
    email: string;
    phone?: string;
    address?: any;
    currentBalance?: number;
  };
  billNumber: number;
  dueDate: Date;
  status: "Draft" | "Open" | "Partial" | "Paid" | "Overdue" | "Void";
  lineItems: BillLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  journalEntryId?: string;
  createdBy: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface BillFormData {
  supplierId: string;
  dueDate: Date;
  status?: string;
  lineItems: BillLineItem[];
  taxRate?: number;
  notes?: string;
}

export interface BillResponse {
  success: boolean;
  data: Bill;
  message?: string;
  error?: string;
}

export interface BillListResponse {
  success: boolean;
  data: Bill[];
  count: number;
  error?: string;
}

class BillService {
  /**
   * Get all bills for the company
   */
  async getAllBills(): Promise<BillListResponse> {
    return apiFetch<BillListResponse>("/bills");
  }

  /**
   * Get bill by ID
   */
  async getBillById(id: string): Promise<BillResponse> {
    return apiFetch<BillResponse>(`/bills/${id}`);
  }

  /**
   * Create a new bill
   */
  async createBill(billData: BillFormData): Promise<BillResponse> {
    return apiFetch<BillResponse>("/bills", {
      method: "POST",
      body: JSON.stringify(billData),
    });
  }

  /**
   * Update an existing bill
   */
  async updateBill(
    id: string,
    billData: Partial<BillFormData>,
  ): Promise<BillResponse> {
    return apiFetch<BillResponse>(`/bills/${id}`, {
      method: "PUT",
      body: JSON.stringify(billData),
    });
  }

  /**
   * Delete a bill (draft only)
   */
  async deleteBill(id: string): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(`/bills/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Void a bill
   */
  async voidBill(id: string): Promise<BillResponse> {
    return apiFetch<BillResponse>(`/bills/${id}/void`, {
      method: "POST",
    });
  }

  /**
   * Get bills by supplier
   */
  async getBillsBySupplier(supplierId: string): Promise<BillListResponse> {
    return apiFetch<BillListResponse>(`/bills/supplier/${supplierId}`);
  }

  /**
   * Get bills by status
   */
  async getBillsByStatus(
    status: "Draft" | "Open" | "Partial" | "Paid" | "Overdue" | "Void",
  ): Promise<BillListResponse> {
    return apiFetch<BillListResponse>(`/bills/status/${status}`);
  }

  /**
   * Get overdue bills
   */
  async getOverdueBills(): Promise<BillListResponse> {
    return apiFetch<BillListResponse>("/bills/overdue");
  }

  /**
   * Search bills
   */
  async searchBills(searchTerm: string): Promise<BillListResponse> {
    return apiFetch<BillListResponse>(
      `/bills/search?q=${encodeURIComponent(searchTerm)}`,
    );
  }
}

export const billService = new BillService();
