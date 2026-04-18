import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/config/auth-client";
import { useOrganization } from "@/hooks/use-organization";
import {
  dashboardService,
  type DashboardOverview,
} from "@/lib/services/dashboard.service";

export function useDashboard() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: sessionData, isPending: sessionPending } = useSession();
  const { organizationId, isPending: organizationPending } = useOrganization();

  const hasActiveOrganization =
    !!organizationId || !!(sessionData as any)?.session?.activeOrganizationId;

  const fetch = useCallback(async () => {
    if (!hasActiveOrganization) {
      setIsLoading(sessionPending || organizationPending);
      setError(null);
      return;
    }

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
  }, [hasActiveOrganization, organizationPending, sessionPending]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}
