import { apiFetch } from "@/lib/config/api-client";
import type {
  InventoryItem,
  InventoryItemForm,
  InventoryResponse,
  InventoryListResponse,
  InventoryValueResponse,
} from "@/lib/types/inventory";

class InventoryService {
  /**
   * Get all inventory items for the company
   */
  async getAllItems(): Promise<InventoryListResponse> {
    return apiFetch<InventoryListResponse>("/inventory");
  }

  /**
   * Get active inventory items only
   */
  async getActiveItems(): Promise<InventoryListResponse> {
    return apiFetch<InventoryListResponse>("/inventory/active");
  }

  /**
   * Get a single inventory item by ID
   */
  async getItemById(id: string): Promise<InventoryResponse> {
    return apiFetch<InventoryResponse>(`/inventory/${id}`);
  }

  /**
   * Get inventory item by SKU
   */
  async getItemBySku(sku: string): Promise<InventoryResponse> {
    return apiFetch<InventoryResponse>(`/inventory/sku/${sku}`);
  }

  /**
   * Get inventory items by category
   */
  async getItemsByCategory(
    category: "Food" | "Non-Food"
  ): Promise<InventoryListResponse> {
    return apiFetch<InventoryListResponse>(`/inventory/category/${category}`);
  }

  /**
   * Get items needing reorder
   */
  async getItemsNeedingReorder(): Promise<InventoryListResponse> {
    return apiFetch<InventoryListResponse>("/inventory/reorder/needed");
  }

  /**
   * Search inventory items
   */
  async searchItems(query: string): Promise<InventoryListResponse> {
    return apiFetch<InventoryListResponse>(
      `/inventory/search?q=${encodeURIComponent(query)}`
    );
  }

  /**
   * Create a new inventory item
   */
  async createItem(itemData: InventoryItemForm): Promise<InventoryResponse> {
    // Convert Date objects to ISO strings for API
    const payload = {
      ...itemData,
      quantityAsOfDate:
        itemData.quantityAsOfDate instanceof Date
          ? itemData.quantityAsOfDate.toISOString()
          : itemData.quantityAsOfDate,
    };

    return apiFetch<InventoryResponse>("/inventory", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Update an existing inventory item
   */
  async updateItem(
    id: string,
    updateData: Partial<InventoryItemForm>
  ): Promise<InventoryResponse> {
    // Convert Date objects to ISO strings for API
    const payload = {
      ...updateData,
      quantityAsOfDate:
        updateData.quantityAsOfDate instanceof Date
          ? updateData.quantityAsOfDate.toISOString()
          : updateData.quantityAsOfDate,
    };

    return apiFetch<InventoryResponse>(`/inventory/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Delete (deactivate) an inventory item
   */
  async deleteItem(id: string): Promise<InventoryResponse> {
    return apiFetch<InventoryResponse>(`/inventory/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Adjust inventory quantity
   */
  async adjustQuantity(
    id: string,
    adjustment: number,
    reason: string
  ): Promise<InventoryResponse> {
    return apiFetch<InventoryResponse>(`/inventory/${id}/adjust`, {
      method: "POST",
      body: JSON.stringify({ adjustment, reason }),
    });
  }

  /**
   * Get total inventory value
   */
  async getTotalInventoryValue(): Promise<InventoryValueResponse> {
    return apiFetch<InventoryValueResponse>("/inventory/value/total");
  }

  /**
   * Get inventory valuation report
   */
  async getInventoryValuation(): Promise<any> {
    return apiFetch<any>("/inventory/reports/valuation");
  }

  /**
   * Get item transactions
   */
  async getItemTransactions(id: string): Promise<any> {
    return apiFetch<any>(`/inventory/${id}/transactions`);
  }
}

export const inventoryService = new InventoryService();
