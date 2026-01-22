import { useState, useEffect, useCallback } from "react";
import { supplierService } from "@/lib/services/supplier.service";
import type { Supplier, SupplierForm } from "@/lib/types/supplier";
import { toast } from "sonner";

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await supplierService.getAllSuppliers();
      setSuppliers(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch suppliers";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await supplierService.getActiveSuppliers();
      setSuppliers(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch active suppliers";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchSuppliers = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await supplierService.searchSuppliers(query);
      setSuppliers(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to search suppliers";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSupplier = useCallback(
    async (supplierData: SupplierForm) => {
      try {
        const response = await supplierService.createSupplier(supplierData);
        toast.success("Supplier created successfully");
        await fetchSuppliers(); // Refresh list
        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create supplier";
        toast.error(errorMessage);
        throw err;
      }
    },
    [fetchSuppliers],
  );

  const updateSupplier = useCallback(
    async (id: string, updateData: Partial<SupplierForm>) => {
      try {
        const response = await supplierService.updateSupplier(id, updateData);
        toast.success("Supplier updated successfully");
        await fetchSuppliers(); // Refresh list
        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update supplier";
        toast.error(errorMessage);
        throw err;
      }
    },
    [fetchSuppliers],
  );

  const deleteSupplier = useCallback(
    async (id: string) => {
      try {
        await supplierService.deleteSupplier(id);
        toast.success("Supplier deleted successfully");
        await fetchSuppliers(); // Refresh list
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete supplier";
        toast.error(errorMessage);
        throw err;
      }
    },
    [fetchSuppliers],
  );

  const toggleSupplierStatus = useCallback(
    async (id: string) => {
      try {
        // Find the supplier to get current status
        const supplier = suppliers.find((s) => s._id === id);
        if (!supplier) throw new Error("Supplier not found");

        await updateSupplier(id, { isActive: !supplier.isActive });
        toast.success(
          `Supplier ${supplier.isActive ? "deactivated" : "activated"} successfully`,
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to toggle supplier status";
        toast.error(errorMessage);
        throw err;
      }
    },
    [suppliers, updateSupplier],
  );

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    fetchActiveSuppliers,
    searchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    toggleSupplierStatus,
  };
}
