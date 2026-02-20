import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  reportService,
  ARAgingReport,
  APAgingReport,
  ReportResponse,
} from "@/lib/services/report.service";

export function useReports() {
  const [arAgingReport, setARAgingReport] = useState<ARAgingReport | null>(
    null,
  );
  const [apAgingReport, setAPAgingReport] = useState<APAgingReport | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch AR Aging Report
   */
  const fetchARAgingReport = useCallback(async (asOfDate?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reportService.getARAgingReport(asOfDate);
      if (response.success) {
        setARAgingReport(response.data);
        return response.data;
      } else {
        throw new Error(response.error || "Failed to fetch AR aging report");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch AR aging report";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch AP Aging Report
   */
  const fetchAPAgingReport = useCallback(async (asOfDate?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reportService.getAPAgingReport(asOfDate);
      if (response.success) {
        setAPAgingReport(response.data);
        return response.data;
      } else {
        throw new Error(response.error || "Failed to fetch AP aging report");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch AP aging report";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch Balance Sheet
   */
  const fetchBalanceSheet = useCallback(async (asOfDate?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reportService.getBalanceSheet(asOfDate);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || "Failed to fetch balance sheet");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch balance sheet";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch Income Statement
   */
  const fetchIncomeStatement = useCallback(
    async (startDate?: string, endDate?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await reportService.getIncomeStatement(
          startDate,
          endDate,
        );
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.error || "Failed to fetch income statement");
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to fetch income statement";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Fetch Cash Flow Statement
   */
  const fetchCashFlowStatement = useCallback(
    async (startDate?: string, endDate?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await reportService.getCashFlowStatement(
          startDate,
          endDate,
        );
        if (response.success) {
          return response.data;
        } else {
          throw new Error(
            response.error || "Failed to fetch cash flow statement",
          );
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to fetch cash flow statement";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Fetch Trial Balance
   */
  const fetchTrialBalance = useCallback(async (asOfDate?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reportService.getTrialBalance(asOfDate);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || "Failed to fetch trial balance");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch trial balance";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    arAgingReport,
    apAgingReport,
    isLoading,
    error,

    // Actions
    fetchARAgingReport,
    fetchAPAgingReport,
    fetchBalanceSheet,
    fetchIncomeStatement,
    fetchCashFlowStatement,
    fetchTrialBalance,
  };
}
