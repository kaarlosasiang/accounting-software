import { useState, useEffect, useCallback } from "react";
import { customerService } from "@/lib/services/customer.service";
import type { Customer, CustomerForm } from "@/lib/types/customer";
import { toast } from "sonner";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerService.getAllCustomers();
      setCustomers(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch customers";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerService.getActiveCustomers();
      setCustomers(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch active customers";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCustomers = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerService.searchCustomers(query);
      setCustomers(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to search customers";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = useCallback(
    async (customerData: CustomerForm) => {
      try {
        const response = await customerService.createCustomer(customerData);
        toast.success("Customer created successfully");
        await fetchCustomers(); // Refresh list
        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create customer";
        toast.error(errorMessage);
        throw err;
      }
    },
    [fetchCustomers]
  );

  const updateCustomer = useCallback(
    async (id: string, updateData: Partial<CustomerForm>) => {
      try {
        const response = await customerService.updateCustomer(id, updateData);
        toast.success("Customer updated successfully");
        await fetchCustomers(); // Refresh list
        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update customer";
        toast.error(errorMessage);
        throw err;
      }
    },
    [fetchCustomers]
  );

  const deleteCustomer = useCallback(
    async (id: string) => {
      try {
        await customerService.deleteCustomer(id);
        toast.success("Customer deleted successfully");
        await fetchCustomers(); // Refresh list
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete customer";
        toast.error(errorMessage);
        throw err;
      }
    },
    [fetchCustomers]
  );

  const toggleCustomerStatus = useCallback(
    async (id: string) => {
      try {
        const response = await customerService.toggleCustomerStatus(id);
        toast.success(
          `Customer ${
            response.data.isActive ? "activated" : "deactivated"
          } successfully`
        );
        await fetchCustomers(); // Refresh list
        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to toggle customer status";
        toast.error(errorMessage);
        throw err;
      }
    },
    [fetchCustomers]
  );

  const checkCreditAvailability = useCallback(
    async (id: string, amount: number) => {
      try {
        const response = await customerService.checkCreditAvailability(
          id,
          amount
        );
        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to check credit availability";
        toast.error(errorMessage);
        throw err;
      }
    },
    []
  );

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    fetchActiveCustomers,
    searchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    toggleCustomerStatus,
    checkCreditAvailability,
  };
}
