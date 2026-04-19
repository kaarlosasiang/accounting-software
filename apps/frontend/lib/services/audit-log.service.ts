import { apiFetch } from "@/lib/config/api-client";

export interface AuditLogEntry {
  _id: string;
  companyId: string;
  userId: string;
  userName: string;
  action: "Create" | "Update" | "Delete" | "View" | "Login" | "Logout" | "Export";
  module: string;
  recordId: string;
  recordType: string;
  changes: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface AuditLogFilters {
  module?: string;
  action?: AuditLogEntry["action"];
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogListResponse {
  success: boolean;
  data: AuditLogEntry[];
  count: number;
  page: number;
  limit: number;
  error?: string;
}

export interface AuditLogDetailResponse {
  success: boolean;
  data: AuditLogEntry;
  error?: string;
}

function buildQuery(filters: AuditLogFilters): string {
  const params = new URLSearchParams();
  if (filters.module) params.set("module", filters.module);
  if (filters.action) params.set("action", filters.action);
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.page !== undefined) params.set("page", String(filters.page));
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const auditLogService = {
  async getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogListResponse> {
    return apiFetch<AuditLogListResponse>(`/audit-logs${buildQuery(filters)}`);
  },

  async getAuditLogById(id: string): Promise<AuditLogDetailResponse> {
    return apiFetch<AuditLogDetailResponse>(`/audit-logs/${id}`);
  },

  async getRecordHistory(recordId: string): Promise<AuditLogListResponse> {
    return apiFetch<AuditLogListResponse>(`/audit-logs/record/${recordId}`);
  },
};
