"use client";

import { useState, useEffect, useCallback } from "react";
import { inventoryService } from "@/lib/services/inventory.service";
import type {
  InventoryItem,
  InventoryItemForm,
  InventoryListResponse,
  InventoryResponse,
} from "@/lib/types/inventory";
import { toast } from "sonner";

interface UseInventoryOptions {
  category?: "Food" | "Non-Food" | "Service";
  activeOnly?: boolean;
  lowStockOnly?: boolean;
  autoFetch?: boolean;
}

interface UseInventoryReturn {
  items: InventoryItem[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  refetch: () => Promise<void>;
  createItem: (data: InventoryItemForm) => Promise<InventoryItem | null>;
  updateItem: (
    id: string,
    data: Partial<InventoryItemForm>,
  ) => Promise<InventoryItem | null>;
  deleteItem: (id: string) => Promise<boolean>;
  adjustQuantity: (
    id: string,
    adjustment: number,
    reason: string,
  ) => Promise<InventoryItem | null>;
}

/**
 * Hook for managing inventory items
 */
export function useInventory(
  options: UseInventoryOptions = {},
): UseInventoryReturn {
  const {
    category,
    activeOnly = false,
    lowStockOnly = false,
    autoFetch = true,
  } = options;

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let response: InventoryListResponse;

      if (lowStockOnly) {
        response = await inventoryService.getItemsNeedingReorder();
      } else if (category && category !== "Service") {
        response = await inventoryService.getItemsByCategory(category);
      } else if (activeOnly) {
        response = await inventoryService.getActiveItems();
      } else {
        response = await inventoryService.getAllItems();
      }

      if (response.success && response.data) {
        setItems(response.data);
        setTotalCount(response.count || response.data.length);
      } else {
        throw new Error(response.error || "Failed to fetch inventory items");
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(error.message || "Failed to fetch inventory items");
    } finally {
      setIsLoading(false);
    }
  }, [category, activeOnly, lowStockOnly]);

  useEffect(() => {
    if (autoFetch) {
      fetchItems();
    }
  }, [autoFetch, fetchItems]);

  const createItem = async (
    data: InventoryItemForm,
  ): Promise<InventoryItem | null> => {
    try {
      setIsLoading(true);
      const response = await inventoryService.createItem(data);

      if (response.success && response.data) {
        toast.success("Inventory item created successfully");
        await fetchItems(); // Refresh the list
        return response.data;
      } else {
        throw new Error(response.error || "Failed to create inventory item");
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to create inventory item");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (
    id: string,
    data: Partial<InventoryItemForm>,
  ): Promise<InventoryItem | null> => {
    try {
      setIsLoading(true);
      const response = await inventoryService.updateItem(id, data);

      if (response.success && response.data) {
        toast.success("Inventory item updated successfully");
        await fetchItems(); // Refresh the list
        return response.data;
      } else {
        throw new Error(response.error || "Failed to update inventory item");
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to update inventory item");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await inventoryService.deleteItem(id);

      if (response.success) {
        toast.success("Inventory item deleted successfully");
        await fetchItems(); // Refresh the list
        return true;
      } else {
        throw new Error(response.error || "Failed to delete inventory item");
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to delete inventory item");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const adjustQuantity = async (
    id: string,
    adjustment: number,
    reason: string,
  ): Promise<InventoryItem | null> => {
    try {
      setIsLoading(true);
      const response = await inventoryService.adjustQuantity(
        id,
        adjustment,
        reason,
      );

      if (response.success && response.data) {
        toast.success("Inventory quantity adjusted successfully");
        await fetchItems(); // Refresh the list
        return response.data;
      } else {
        throw new Error(
          response.error || "Failed to adjust inventory quantity",
        );
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to adjust inventory quantity");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    items,
    isLoading,
    error,
    totalCount,
    refetch: fetchItems,
    createItem,
    updateItem,
    deleteItem,
    adjustQuantity,
  };
}

/**
 * Hook for fetching a single inventory item
 */
export function useInventoryItem(id: string | null) {
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchItem = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await inventoryService.getItemById(id);

      if (response.success && response.data) {
        setItem(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch inventory item");
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(error.message || "Failed to fetch inventory item");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  return {
    item,
    isLoading,
    error,
    refetch: fetchItem,
  };
}

/**
 * Hook for inventory search
 */
export function useInventorySearch() {
  const [results, setResults] = useState<InventoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<Error | null>(null);

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);

      const response = await inventoryService.searchItems(query);

      if (response.success && response.data) {
        setResults(response.data);
      } else {
        throw new Error(response.error || "Search failed");
      }
    } catch (err) {
      const error = err as Error;
      setSearchError(error);
      toast.error(error.message || "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setSearchError(null);
  };

  return {
    results,
    isSearching,
    searchError,
    search,
    clearResults,
  };
}

/**
 * Hook for inventory transactions
 */
export function useInventoryTransactions(itemId?: string) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = itemId
        ? await inventoryService.getItemTransactions(itemId)
        : await inventoryService.getAllTransactions();

      if (response.success && response.data) {
        setTransactions(response.data);
      } else {
        throw new Error(
          response.error || "Failed to fetch inventory transactions",
        );
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(error.message || "Failed to fetch transactions");
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
  };
}

/**
 * Hook for inventory value
 */
export function useInventoryValue() {
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchValue = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await inventoryService.getTotalInventoryValue();

      if (response.success && response.data) {
        setTotalValue(response.data.totalValue);
      } else {
        throw new Error(response.error || "Failed to fetch inventory value");
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(error.message || "Failed to fetch inventory value");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchValue();
  }, [fetchValue]);

  return {
    totalValue,
    isLoading,
    error,
    refetch: fetchValue,
  };
}
