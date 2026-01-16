import { apiFetch } from "@/lib/config/api-client";
import type {
  Customer,
  CustomerForm,
  CustomerResponse,
  CustomerListResponse,
  CreditCheckResponse,
} from "@/lib/types/customer";

class CustomerService {
  /**
   * Get all customers for the company
   */
  async getAllCustomers(): Promise<CustomerListResponse> {
    return apiFetch<CustomerListResponse>("/customers");
  }

  /**
   * Get active customers only
   */
  async getActiveCustomers(): Promise<CustomerListResponse> {
    return apiFetch<CustomerListResponse>("/customers/active");
  }

  /**
   * Get a single customer by ID
   */
  async getCustomerById(id: string): Promise<CustomerResponse> {
    return apiFetch<CustomerResponse>(`/customers/${id}`);
  }

  /**
   * Get customer by customer code
   */
  async getCustomerByCode(code: string): Promise<CustomerResponse> {
    return apiFetch<CustomerResponse>(`/customers/code/${code}`);
  }

  /**
   * Search customers
   */
  async searchCustomers(query: string): Promise<CustomerListResponse> {
    return apiFetch<CustomerListResponse>(
      `/customers/search?q=${encodeURIComponent(query)}`
    );
  }

  /**
   * Create a new customer
   */
  async createCustomer(customerData: CustomerForm): Promise<CustomerResponse> {
    return apiFetch<CustomerResponse>("/customers", {
      method: "POST",
      body: JSON.stringify(customerData),
    });
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(
    id: string,
    updateData: Partial<CustomerForm>
  ): Promise<CustomerResponse> {
    return apiFetch<CustomerResponse>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(id: string): Promise<CustomerResponse> {
    return apiFetch<CustomerResponse>(`/customers/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Toggle customer active status
   */
  async toggleCustomerStatus(id: string): Promise<CustomerResponse> {
    return apiFetch<CustomerResponse>(`/customers/${id}/toggle-status`, {
      method: "PATCH",
    });
  }

  /**
   * Update customer balance
   */
  async updateCustomerBalance(
    id: string,
    amount: number
  ): Promise<CustomerResponse> {
    return apiFetch<CustomerResponse>(`/customers/${id}/balance`, {
      method: "PATCH",
      body: JSON.stringify({ amount }),
    });
  }

  /**
   * Check credit availability
   */
  async checkCreditAvailability(
    id: string,
    amount: number
  ): Promise<CreditCheckResponse> {
    return apiFetch<CreditCheckResponse>(`/customers/${id}/check-credit`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  }
}

export const customerService = new CustomerService();
