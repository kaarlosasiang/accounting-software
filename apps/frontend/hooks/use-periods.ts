import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  periodService,
  AccountingPeriod,
  PeriodFormData,
  PeriodStatus,
} from "@/lib/services/period.service";

export function usePeriods() {
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<AccountingPeriod | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all periods
   */
  const fetchPeriods = useCallback(
    async (params?: { fiscalYear?: number; status?: PeriodStatus }) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await periodService.getAllPeriods(params);
        if (response.success) {
          setPeriods(response.data);
          return response.data;
        } else {
          throw new Error(response.error || "Failed to fetch periods");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch periods";
        setError(message);
        toast.error(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Fetch period by ID
   */
  const fetchPeriodById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await periodService.getPeriodById(id);
      if (response.success) {
        setCurrentPeriod(response.data);
        return response.data;
      } else {
        throw new Error(response.error || "Failed to fetch period");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch period";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new period
   */
  const createPeriod = useCallback(
    async (periodData: PeriodFormData) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await periodService.createPeriod(periodData);
        if (response.success) {
          toast.success("Period created successfully");
          await fetchPeriods();
          return response.data;
        } else {
          throw new Error(response.error || "Failed to create period");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create period";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPeriods],
  );

  /**
   * Close a period
   */
  const closePeriod = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await periodService.closePeriod(id);
        if (response.success) {
          toast.success(response.message || "Period closed successfully");
          await fetchPeriods();
          return response.data;
        } else {
          throw new Error(response.error || "Failed to close period");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to close period";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPeriods],
  );

  /**
   * Reopen a period
   */
  const reopenPeriod = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await periodService.reopenPeriod(id);
        if (response.success) {
          toast.success(response.message || "Period reopened successfully");
          await fetchPeriods();
          return response.data;
        } else {
          throw new Error(response.error || "Failed to reopen period");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to reopen period";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPeriods],
  );

  /**
   * Lock a period
   */
  const lockPeriod = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await periodService.lockPeriod(id);
        if (response.success) {
          toast.success(response.message || "Period locked successfully");
          await fetchPeriods();
          return response.data;
        } else {
          throw new Error(response.error || "Failed to lock period");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to lock period";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPeriods],
  );

  /**
   * Update period
   */
  const updatePeriod = useCallback(
    async (id: string, data: { periodName?: string; notes?: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await periodService.updatePeriod(id, data);
        if (response.success) {
          toast.success("Period updated successfully");
          await fetchPeriods();
          return response.data;
        } else {
          throw new Error(response.error || "Failed to update period");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update period";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPeriods],
  );

  /**
   * Delete period
   */
  const deletePeriod = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await periodService.deletePeriod(id);
        if (response.success) {
          toast.success(response.message || "Period deleted successfully");
          await fetchPeriods();
          return true;
        } else {
          throw new Error(response.error || "Failed to delete period");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete period";
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPeriods],
  );

  /**
   * Check if a date is in a closed period
   */
  const checkDateInClosedPeriod = useCallback(async (date: string) => {
    try {
      const response = await periodService.checkDateInClosedPeriod(date);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(
          response.error || "Failed to check period status for date",
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to check period status for date";
      console.error(message);
      return { isInClosedPeriod: false, period: null };
    }
  }, []);

  /**
   * Find period for a date
   */
  const findPeriodForDate = useCallback(async (date: string) => {
    try {
      const response = await periodService.findPeriodForDate(date);
      if (response.success) {
        return response.data;
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  }, []);

  return {
    // State
    periods,
    currentPeriod,
    isLoading,
    error,

    // Actions
    fetchPeriods,
    fetchPeriodById,
    createPeriod,
    closePeriod,
    reopenPeriod,
    lockPeriod,
    updatePeriod,
    deletePeriod,
    checkDateInClosedPeriod,
    findPeriodForDate,
  };
}
