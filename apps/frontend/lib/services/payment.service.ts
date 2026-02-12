import { apiFetch } from "@/lib/config/api-client";
import {
  Payment,
  PaymentFormData,
  PaymentSuggestion,
  PaymentSummary,
} from "@/lib/types/payment";

export const paymentService = {
  /**
   * Record payment for an invoice
   */
  async recordInvoicePayment(
    invoiceId: string,
    paymentData: PaymentFormData,
  ): Promise<PaymentSummary> {
    return await apiFetch<PaymentSummary>(`/invoices/${invoiceId}/payments`, {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  },

  /**
   * Record payment for a bill
   */
  async recordBillPayment(
    billId: string,
    paymentData: PaymentFormData,
  ): Promise<PaymentSummary> {
    return await apiFetch<PaymentSummary>(`/bills/${billId}/payments`, {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  },

  /**
   * Get payment history for an invoice
   */
  async getInvoicePayments(invoiceId: string): Promise<Payment[]> {
    return await apiFetch<Payment[]>(`/invoices/${invoiceId}/payments`);
  },

  /**
   * Get payment history for a bill
   */
  async getBillPayments(billId: string): Promise<Payment[]> {
    return await apiFetch<Payment[]>(`/bills/${billId}/payments`);
  },

  /**
   * Get payment suggestions for a customer
   */
  async getPaymentSuggestions(
    customerId: string,
    amount: number,
  ): Promise<PaymentSuggestion> {
    return await apiFetch<PaymentSuggestion>(
      "/api/v1/payments/suggest-allocations",
      {
        method: "POST",
        body: JSON.stringify({ customerId, paymentAmount: amount }),
      },
    );
  },

  /**
   * Get all received payments
   */
  async getReceivedPayments(): Promise<Payment[]> {
    return await apiFetch<Payment[]>("/api/v1/payments/received");
  },

  /**
   * Get all made payments
   */
  async getMadePayments(): Promise<Payment[]> {
    return await apiFetch<Payment[]>("/api/v1/payments/made");
  },

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<Payment> {
    return await apiFetch<Payment>(`/api/v1/payments/${paymentId}`);
  },

  /**
   * Get payments for a specific customer
   */
  async getCustomerPayments(customerId: string): Promise<Payment[]> {
    return await apiFetch<Payment[]>(`/api/v1/payments/customer/${customerId}`);
  },

  /**
   * Void a payment (reverse the transaction)
   */
  async voidPayment(paymentId: string): Promise<{
    success: boolean;
    data: Payment;
    message?: string;
    error?: string;
  }> {
    return await apiFetch<{
      success: boolean;
      data: Payment;
      message?: string;
      error?: string;
    }>(`/payments/${paymentId}/void`, {
      method: "POST",
    });
  },
};
