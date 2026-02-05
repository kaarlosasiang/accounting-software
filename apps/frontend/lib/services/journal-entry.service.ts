import { apiFetch } from "@/lib/config/api-client";
import type {
  JournalEntry,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  LedgerEntry,
  AccountLedger,
  GeneralLedgerAccount,
  AccountBalance,
  TrialBalance,
  JournalEntryType,
  JournalEntryStatus,
} from "../types/journal-entry";

/**
 * Journal Entry Service
 * Handles all journal entry and ledger API calls
 */
export const journalEntryService = {
  /**
   * Get all journal entries
   */
  async getAllJournalEntries(params?: {
    status?: JournalEntryStatus;
    type?: JournalEntryType;
    limit?: number;
    skip?: number;
  }): Promise<JournalEntry[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.type) queryParams.append("type", params.type.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.skip) queryParams.append("skip", params.skip.toString());

    const url = `/journal-entries${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiFetch<{ data: JournalEntry[] }>(url);
    return response.data;
  },

  /**
   * Get journal entry by ID
   */
  async getJournalEntryById(id: string): Promise<JournalEntry> {
    const response = await apiFetch<{ data: JournalEntry }>(
      `/journal-entries/${id}`,
    );
    return response.data;
  },

  /**
   * Get journal entries by date range
   */
  async getByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<JournalEntry[]> {
    const response = await apiFetch<{ data: JournalEntry[] }>(
      `/journal-entries/date-range?startDate=${startDate}&endDate=${endDate}`,
    );
    return response.data;
  },

  /**
   * Get journal entries by type
   */
  async getByType(type: JournalEntryType): Promise<JournalEntry[]> {
    const response = await apiFetch<{ data: JournalEntry[] }>(
      `/journal-entries/type/${type}`,
    );
    return response.data;
  },

  /**
   * Get journal entries by status
   */
  async getByStatus(status: JournalEntryStatus): Promise<JournalEntry[]> {
    const response = await apiFetch<{ data: JournalEntry[] }>(
      `/journal-entries/status/${status}`,
    );
    return response.data;
  },

  /**
   * Create new journal entry
   */
  async createJournalEntry(
    data: CreateJournalEntryInput,
  ): Promise<JournalEntry> {
    const response = await apiFetch<{ data: JournalEntry }>(
      "/journal-entries",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    return response.data;
  },

  /**
   * Update journal entry (draft only)
   */
  async updateJournalEntry(
    id: string,
    data: UpdateJournalEntryInput,
  ): Promise<JournalEntry> {
    const response = await apiFetch<{ data: JournalEntry }>(
      `/journal-entries/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
    return response.data;
  },

  /**
   * Delete journal entry (draft only)
   */
  async deleteJournalEntry(id: string): Promise<void> {
    await apiFetch(`/journal-entries/${id}`, { method: "DELETE" });
  },

  /**
   * Post journal entry
   */
  async postJournalEntry(id: string): Promise<JournalEntry> {
    const response = await apiFetch<{ data: JournalEntry }>(
      `/journal-entries/${id}/post`,
      {
        method: "POST",
      },
    );
    return response.data;
  },

  /**
   * Void journal entry
   */
  async voidJournalEntry(id: string): Promise<JournalEntry> {
    const response = await apiFetch<{ data: JournalEntry }>(
      `/journal-entries/${id}/void`,
      {
        method: "POST",
      },
    );
    return response.data;
  },
};

/**
 * Ledger Service
 * Handles all ledger/general ledger API calls
 */
export const ledgerService = {
  /**
   * Get all ledger entries
   */
  async getAllLedgerEntries(params?: {
    limit?: number;
    skip?: number;
  }): Promise<LedgerEntry[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.skip) queryParams.append("skip", params.skip.toString());

    const url = `/ledger${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiFetch<{ data: LedgerEntry[] }>(url);
    return response.data;
  },

  /**
   * Get general ledger
   */
  async getGeneralLedger(
    startDate?: string,
    endDate?: string,
  ): Promise<GeneralLedgerAccount[]> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    const url = `/ledger/general${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiFetch<{ data: GeneralLedgerAccount[] }>(url);
    return response.data;
  },

  /**
   * Get ledger entries by account
   */
  async getByAccount(
    accountId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AccountLedger> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    const url = `/ledger/account/${accountId}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiFetch<{ data: AccountLedger }>(url);
    return response.data;
  },

  /**
   * Get ledger entries by journal entry
   */
  async getByJournalEntry(journalEntryId: string): Promise<LedgerEntry[]> {
    const response = await apiFetch<{ data: LedgerEntry[] }>(
      `/ledger/journal-entry/${journalEntryId}`,
    );
    return response.data;
  },

  /**
   * Get ledger entries by date range
   */
  async getByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<LedgerEntry[]> {
    const response = await apiFetch<{ data: LedgerEntry[] }>(
      `/ledger/date-range?startDate=${startDate}&endDate=${endDate}`,
    );
    return response.data;
  },

  /**
   * Get account balance
   */
  async getAccountBalance(
    accountId: string,
    asOfDate?: string,
  ): Promise<AccountBalance> {
    const queryParams = new URLSearchParams();
    if (asOfDate) queryParams.append("asOfDate", asOfDate);

    const url = `/ledger/account/${accountId}/balance${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiFetch<{ data: AccountBalance }>(url);
    return response.data;
  },

  /**
   * Get trial balance
   */
  async getTrialBalance(asOfDate?: string): Promise<TrialBalance> {
    const queryParams = new URLSearchParams();
    if (asOfDate) queryParams.append("asOfDate", asOfDate);

    const url = `/ledger/trial-balance${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiFetch<{ data: TrialBalance }>(url);
    return response.data;
  },
};
