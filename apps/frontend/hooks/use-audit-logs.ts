import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
  AuditLogEntry,
  AuditLogFilters,
  auditLogService,
} from "@/lib/services/audit-log.service";

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  const fetchLogs = useCallback(
    async (filters: AuditLogFilters = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await auditLogService.getAuditLogs({
          ...filters,
          page: filters.page ?? page,
          limit: filters.limit ?? limit,
        });
        if (response.success) {
          setLogs(response.data);
          setTotal(response.count);
          setPage(response.page);
        } else {
          throw new Error(response.error || "Failed to fetch audit logs");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch audit logs";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [page, limit],
  );

  const fetchNextPage = useCallback(
    async (filters: AuditLogFilters = {}) => {
      await fetchLogs({ ...filters, page: page + 1 });
    },
    [fetchLogs, page],
  );

  const fetchPrevPage = useCallback(
    async (filters: AuditLogFilters = {}) => {
      if (page <= 1) return;
      await fetchLogs({ ...filters, page: page - 1 });
    },
    [fetchLogs, page],
  );

  return {
    logs,
    isLoading,
    error,
    total,
    page,
    limit,
    fetchLogs,
    fetchNextPage,
    fetchPrevPage,
  };
}
