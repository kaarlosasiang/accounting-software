import { apiFetch } from "@/lib/config/api-client";
import type {
  Supplier,
  SupplierForm,
  SupplierResponse,
  SupplierListResponse,
} from "@/lib/types/supplier";

class SupplierService {
  /**
   * Get all suppliers for the company
   */
  async getAllSuppliers(): Promise<SupplierListResponse> {
    return apiFetch<SupplierListResponse>("/suppliers");
  }

  /**
   * Get active suppliers only
   */
  async getActiveSuppliers(): Promise<SupplierListResponse> {
    return apiFetch<SupplierListResponse>("/suppliers/active");
  }

  /**
   * Get a single supplier by ID
   */
  async getSupplierById(id: string): Promise<SupplierResponse> {
    return apiFetch<SupplierResponse>(`/suppliers/${id}`);
  }

  /**
   * Get supplier by supplier code
   */
  async getSupplierByCode(code: string): Promise<SupplierResponse> {
    return apiFetch<SupplierResponse>(`/suppliers/code/${code}`);
  }

  /**
   * Search suppliers
   */
  async searchSuppliers(query: string): Promise<SupplierListResponse> {
    return apiFetch<SupplierListResponse>(
      `/suppliers/search?q=${encodeURIComponent(query)}`
    );
  }

  /**
   * Create a new supplier
   */
  async createSupplier(supplierData: SupplierForm): Promise<SupplierResponse> {
    return apiFetch<SupplierResponse>("/suppliers", {
      method: "POST",
      body: JSON.stringify(supplierData),
    });
  }

  /**
   * Update an existing supplier
   */
  async updateSupplier(
    id: string,
    updateData: Partial<SupplierForm>
  ): Promise<SupplierResponse> {
    return apiFetch<SupplierResponse>(`/suppliers/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Delete (deactivate) a supplier
   */
  async deleteSupplier(id: string): Promise<SupplierResponse> {
    return apiFetch<SupplierResponse>(`/suppliers/${id}`, {
      method: "DELETE",
    });
  }
}

export const supplierService = new SupplierService();
