import { useState, useEffect } from "react";
import { billService, Bill, BillFormData } from "@/lib/services/bill.service";
import { toast } from "sonner";

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await billService.getAllBills();
      if (response.success) {
        setBills(response.data);
      } else {
        setError(response.error || "Failed to fetch bills");
        toast.error(response.error || "Failed to fetch bills");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load bills";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getBillById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await billService.getBillById(id);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || "Failed to fetch bill");
        toast.error(response.error || "Failed to fetch bill");
        return null;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load bill";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createBill = async (billData: BillFormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await billService.createBill(billData);
      if (response.success) {
        toast.success("Bill created successfully");
        await fetchBills();
        return response.data;
      } else {
        setError(response.error || "Failed to create bill");
        toast.error(response.error || "Failed to create bill");
        return null;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create bill";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateBill = async (id: string, billData: Partial<BillFormData>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await billService.updateBill(id, billData);
      if (response.success) {
        toast.success("Bill updated successfully");
        await fetchBills();
        return response.data;
      } else {
        setError(response.error || "Failed to update bill");
        toast.error(response.error || "Failed to update bill");
        return null;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update bill";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteBill = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await billService.deleteBill(id);
      if (response.success) {
        toast.success("Bill deleted successfully");
        await fetchBills();
        return true;
      } else {
        setError(response.message || "Failed to delete bill");
        toast.error(response.message || "Failed to delete bill");
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete bill";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const voidBill = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await billService.voidBill(id);
      if (response.success) {
        toast.success("Bill voided successfully");
        await fetchBills();
        return true;
      } else {
        setError(response.error || "Failed to void bill");
        toast.error(response.error || "Failed to void bill");
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to void bill";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const searchBills = async (searchTerm: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await billService.searchBills(searchTerm);
      if (response.success) {
        setBills(response.data);
      } else {
        setError(response.error || "Failed to search bills");
        toast.error(response.error || "Failed to search bills");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to search bills";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getBillsByStatus = async (
    status: "Draft" | "Open" | "Partial" | "Paid" | "Overdue" | "Void",
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await billService.getBillsByStatus(status);
      if (response.success) {
        setBills(response.data);
      } else {
        setError(response.error || "Failed to fetch bills");
        toast.error(response.error || "Failed to fetch bills");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch bills";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getOverdueBills = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await billService.getOverdueBills();
      if (response.success) {
        setBills(response.data);
      } else {
        setError(response.error || "Failed to fetch overdue bills");
        toast.error(response.error || "Failed to fetch overdue bills");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch overdue bills";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  return {
    bills,
    loading,
    error,
    fetchBills,
    getBillById,
    createBill,
    updateBill,
    deleteBill,
    voidBill,
    searchBills,
    getBillsByStatus,
    getOverdueBills,
  };
}
