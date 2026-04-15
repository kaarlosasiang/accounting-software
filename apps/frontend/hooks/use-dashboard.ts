import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  dashboardService,
  type DashboardOverview,
} from "@/lib/services/dashboard.service";

export function useDashboard() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getOverview();
      if (response.success) {
        setData(response.data);
      } else {
        throw new Error("Failed to load dashboard data");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}
