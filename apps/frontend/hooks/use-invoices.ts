import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  invoiceService,
  Invoice,
  InvoiceFormData,
} from "@/lib/services/invoice.service";

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all invoices
   */
  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await invoiceService.getAllInvoices();
      if (response.success) {
        setInvoices(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch invoices");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch invoices";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch invoices by status
   */
  const fetchInvoicesByStatus = useCallback(
    async (
      status: "Draft" | "Sent" | "Partial" | "Paid" | "Overdue" | "Void",
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await invoiceService.getInvoicesByStatus(status);
        if (response.success) {
          setInvoices(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch invoices");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch invoices";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Fetch invoices by customer
   */
  const fetchInvoicesByCustomer = useCallback(async (customerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await invoiceService.getInvoicesByCustomer(customerId);
      if (response.success) {
        setInvoices(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch invoices");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch invoices";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch overdue invoices
   */
  const fetchOverdueInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await invoiceService.getOverdueInvoices();
      if (response.success) {
        setInvoices(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch overdue invoices");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch overdue invoices";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Search invoices
   */
  const searchInvoices = useCallback(async (query: string) => {
    if (!query.trim()) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await invoiceService.searchInvoices(query);
      if (response.success) {
        setInvoices(response.data);
      } else {
        throw new Error(response.error || "Failed to search invoices");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to search invoices";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new invoice
   */
  const createInvoice = useCallback(
    async (invoiceData: InvoiceFormData) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await invoiceService.createInvoice(invoiceData);
        if (response.success) {
          toast.success("Invoice created successfully");
          await fetchInvoices();
          return response.data;
        } else {
          throw new Error(response.error || "Failed to create invoice");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create invoice";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchInvoices],
  );

  /**
   * Update an existing invoice
   */
  const updateInvoice = useCallback(
    async (id: string, invoiceData: Partial<InvoiceFormData>) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await invoiceService.updateInvoice(id, invoiceData);
        if (response.success) {
          toast.success("Invoice updated successfully");
          await fetchInvoices();
          return response.data;
        } else {
          throw new Error(response.error || "Failed to update invoice");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update invoice";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchInvoices],
  );

  /**
   * Delete an invoice (draft only)
   */
  const deleteInvoice = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await invoiceService.deleteInvoice(id);
        if (response.success) {
          toast.success("Invoice deleted successfully");
          await fetchInvoices();
        } else {
          throw new Error("Failed to delete invoice");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete invoice";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchInvoices],
  );

  /**
   * Void an invoice
   */
  const voidInvoice = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await invoiceService.voidInvoice(id);
        if (response.success) {
          toast.success("Invoice voided successfully");
          await fetchInvoices();
          return response.data;
        } else {
          throw new Error(response.error || "Failed to void invoice");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to void invoice";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchInvoices],
  );

  /**
   * Send invoice to customer
   */
  const sendInvoice = useCallback(
    async (id: string, companyName: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await invoiceService.sendInvoice(id, companyName);
        if (response.success) {
          toast.success("Invoice sent successfully");
          await fetchInvoices();
          return response.data;
        } else {
          throw new Error(response.error || "Failed to send invoice");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to send invoice";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchInvoices],
  );

  return {
    invoices,
    isLoading,
    error,
    fetchInvoices,
    fetchInvoicesByStatus,
    fetchInvoicesByCustomer,
    fetchOverdueInvoices,
    searchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    voidInvoice,
    sendInvoice,
  };
}
