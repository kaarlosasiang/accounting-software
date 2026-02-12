import { apiFetch } from "@/lib/config/api-client";

export type PeriodStatus = "Open" | "Closed" | "Locked";
export type PeriodType = "Monthly" | "Quarterly" | "Annual";

export interface AccountingPeriod {
  _id: string;
  companyId: string;
  periodName: string;
  periodType: PeriodType;
  fiscalYear: number;
  startDate: Date;
  endDate: Date;
  status: PeriodStatus;
  closedBy?: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  closedAt?: Date;
  closingJournalEntryId?: {
    _id: string;
    journalEntryNumber: string;
    description: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PeriodFormData {
  periodName: string;
  periodType: PeriodType;
  fiscalYear: number;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface PeriodCloseResult {
  period: AccountingPeriod;
  closingEntry: any;
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    revenueAccountsClosed: number;
    expenseAccountsClosed: number;
  };
}

export interface PeriodResponse {
  success: boolean;
  data: AccountingPeriod;
  message?: string;
  error?: string;
}

export interface PeriodListResponse {
  success: boolean;
  data: AccountingPeriod[];
  count: number;
  error?: string;
}

export interface PeriodCloseResponse {
  success: boolean;
  data: PeriodCloseResult;
  message?: string;
  error?: string;
}

export interface PeriodCheckResponse {
  success: boolean;
  data: {
    isInClosedPeriod: boolean;
    period: AccountingPeriod | null;
  };
  error?: string;
}

class PeriodService {
  /**
   * Get all accounting periods
   */
  async getAllPeriods(params?: {
    fiscalYear?: number;
    status?: PeriodStatus;
  }): Promise<PeriodListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.fiscalYear)
      queryParams.append("fiscalYear", params.fiscalYear.toString());
    if (params?.status) queryParams.append("status", params.status);
    const queryString = queryParams.toString();
    return apiFetch<PeriodListResponse>(
      `/periods${queryString ? `?${queryString}` : ""}`,
    );
  }

  /**
   * Get period by ID
   */
  async getPeriodById(id: string): Promise<PeriodResponse> {
    return apiFetch<PeriodResponse>(`/periods/${id}`);
  }

  /**
   * Create a new accounting period
   */
  async createPeriod(periodData: PeriodFormData): Promise<PeriodResponse> {
    return apiFetch<PeriodResponse>("/periods", {
      method: "POST",
      body: JSON.stringify(periodData),
    });
  }

  /**
   * Close a period (creates closing entry)
   */
  async closePeriod(id: string): Promise<PeriodCloseResponse> {
    return apiFetch<PeriodCloseResponse>(`/periods/${id}/close`, {
      method: "POST",
    });
  }

  /**
   * Reopen a closed period (reverses closing entry)
   */
  async reopenPeriod(id: string): Promise<PeriodResponse> {
    return apiFetch<PeriodResponse>(`/periods/${id}/reopen`, {
      method: "POST",
    });
  }

  /**
   * Lock a period (prevent modifications)
   */
  async lockPeriod(id: string): Promise<PeriodResponse> {
    return apiFetch<PeriodResponse>(`/periods/${id}/lock`, {
      method: "POST",
    });
  }

  /**
   * Update period details
   */
  async updatePeriod(
    id: string,
    data: { periodName?: string; notes?: string },
  ): Promise<PeriodResponse> {
    return apiFetch<PeriodResponse>(`/periods/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a period
   */
  async deletePeriod(id: string): Promise<PeriodResponse> {
    return apiFetch<PeriodResponse>(`/periods/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Check if a date is in a closed/locked period
   */
  async checkDateInClosedPeriod(date: string): Promise<PeriodCheckResponse> {
    return apiFetch<PeriodCheckResponse>(`/periods/check-date?date=${date}`);
  }

  /**
   * Find period for a specific date
   */
  async findPeriodForDate(date: string): Promise<PeriodResponse> {
    return apiFetch<PeriodResponse>(`/periods/find-by-date?date=${date}`);
  }
}

export const periodService = new PeriodService();
