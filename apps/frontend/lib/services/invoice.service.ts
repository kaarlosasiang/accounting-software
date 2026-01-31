import { apiFetch } from "@/lib/config/api-client";
import { Payment, PaymentFormData, PaymentSummary } from "@/lib/types/payment";

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  accountId: string;
  inventoryItemId?: string;
  amount: number;
}

export interface Invoice {
  _id: string;
  companyId: string;
  customerId: {
    _id: string;
    customerName: string;
    displayName: string;
    email: string;
    phone?: string;
    billingAddress?: any;
    currentBalance?: number;
  };
  invoiceNumber: string;
  invoiceDate?: Date;
  dueDate: Date;
  status: "Draft" | "Sent" | "Partial" | "Paid" | "Overdue" | "Void";
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  terms?: string;
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

export interface InvoiceFormData {
  customerId: string;
  invoiceDate?: Date;
  dueDate: Date;
  status?: string;
  lineItems: InvoiceLineItem[];
  taxRate?: number;
  discount?: number;
  notes?: string;
  terms?: string;
}

export interface InvoiceResponse {
  success: boolean;
  data: Invoice;
  message?: string;
  error?: string;
}

export interface InvoiceListResponse {
  success: boolean;
  data: Invoice[];
  count: number;
  error?: string;
}

class InvoiceService {
  /**
   * Get all invoices for the company
   */
  async getAllInvoices(): Promise<InvoiceListResponse> {
    return apiFetch<InvoiceListResponse>("/invoices");
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string): Promise<InvoiceResponse> {
    return apiFetch<InvoiceResponse>(`/invoices/${id}`);
  }

  /**
   * Create a new invoice
   */
  async createInvoice(invoiceData: InvoiceFormData): Promise<InvoiceResponse> {
    return apiFetch<InvoiceResponse>("/invoices", {
      method: "POST",
      body: JSON.stringify(invoiceData),
    });
  }

  /**
   * Update an existing invoice
   */
  async updateInvoice(
    id: string,
    invoiceData: Partial<InvoiceFormData>,
  ): Promise<InvoiceResponse> {
    return apiFetch<InvoiceResponse>(`/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify(invoiceData),
    });
  }

  /**
   * Delete an invoice (draft only)
   */
  async deleteInvoice(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(`/invoices/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Void an invoice
   */
  async voidInvoice(id: string): Promise<InvoiceResponse> {
    return apiFetch<InvoiceResponse>(`/invoices/${id}/void`, {
      method: "POST",
    });
  }

  /**
   * Get invoices by customer
   */
  async getInvoicesByCustomer(
    customerId: string,
  ): Promise<InvoiceListResponse> {
    return apiFetch<InvoiceListResponse>(`/invoices/customer/${customerId}`);
  }

  /**
   * Get invoices by status
   */
  async getInvoicesByStatus(
    status: "Draft" | "Sent" | "Partial" | "Paid" | "Overdue" | "Void",
  ): Promise<InvoiceListResponse> {
    return apiFetch<InvoiceListResponse>(`/invoices/status/${status}`);
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<InvoiceListResponse> {
    return apiFetch<InvoiceListResponse>("/invoices/overdue");
  }

  /**
   * Search invoices
   */
  async searchInvoices(query: string): Promise<InvoiceListResponse> {
    return apiFetch<InvoiceListResponse>(
      `/invoices/search?q=${encodeURIComponent(query)}`,
    );
  }

  /**
    * Send invoice to customer
    */
  async sendInvoice(id: string, companyName: string): Promise<InvoiceResponse> {
    return apiFetch<InvoiceResponse>(`/invoices/${id}/send`, {
      method: "POST",
      body: JSON.stringify({ companyName }),
    });
  }

  /**
   * Record payment for an invoice
   */
  async recordPayment(invoiceId: string, paymentData: PaymentFormData): Promise<PaymentSummary> {
    return apiFetch<PaymentSummary>(`/invoices/${invoiceId}/payments`, {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Get payment history for an invoice
   */
  async getInvoicePayments(invoiceId: string): Promise<Payment[]> {
    return apiFetch<Payment[]>(`/invoices/${invoiceId}/payments`);
  }
}

export const invoiceService = new InvoiceService();
