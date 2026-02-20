import { apiFetch } from "@/lib/config/api-client";

export interface Account {
  _id: string;
  accountCode: string;
  accountName: string;
  accountType: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  subType?: string;
  balance?: number;
  description?: string;
  normalBalance?: "Debit" | "Credit";
  parentAccount?: string;
  isActive?: boolean; // Optional, defaults to true
  companyId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface AccountsResponse {
  success: boolean;
  data: Account[];
  count: number;
  message?: string;
  error?: string;
}

export interface AccountResponse {
  success: boolean;
  data: Account;
  message?: string;
  error?: string;
}

export interface AccountBalanceResponse {
  success: boolean;
  data: {
    balance: number;
    accountId: string;
  };
  message?: string;
  error?: string;
}

export interface ChartOfAccountsResponse {
  success: boolean;
  data: any; // Define based on your chart structure
  message?: string;
  error?: string;
}

class AccountsService {
  /**
   * Get all accounts for the organization
   */
  async getAllAccounts(): Promise<AccountsResponse> {
    return apiFetch<AccountsResponse>("/accounts");
  }

  /**
   * Get accounts by type (e.g., "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE")
   */
  async getAccountsByType(accountType: string): Promise<AccountsResponse> {
    return apiFetch<AccountsResponse>(`/accounts/type/${accountType}`);
  }

  /**
   * Get a single account by ID
   */
  async getAccountById(id: string): Promise<AccountResponse> {
    return apiFetch<AccountResponse>(`/accounts/${id}`);
  }

  /**
   * Create a new account
   */
  async createAccount(accountData: Partial<Account>): Promise<AccountResponse> {
    try {
      const response = await apiFetch<AccountResponse>("/accounts", {
        method: "POST",
        body: JSON.stringify(accountData),
      });
      // Map message to error for consistent error handling
      if (!response.success && response.message && !response.error) {
        return { ...response, error: response.message };
      }
      return response;
    } catch (error) {
      return {
        success: false,
        data: {} as Account,
        error:
          error instanceof Error ? error.message : "Failed to create account",
      };
    }
  }

  /**
   * Update an existing account
   */
  async updateAccount(
    id: string,
    updateData: Partial<Account>,
  ): Promise<AccountResponse> {
    try {
      const response = await apiFetch<AccountResponse>(`/accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
      // Map message to error for consistent error handling
      if (!response.success && response.message && !response.error) {
        return { ...response, error: response.message };
      }
      return response;
    } catch (error) {
      return {
        success: false,
        data: {} as Account,
        error:
          error instanceof Error ? error.message : "Failed to update account",
      };
    }
  }

  /**
   * Delete an account
   */
  async deleteAccount(id: string): Promise<AccountResponse> {
    try {
      const response = await apiFetch<AccountResponse>(`/accounts/${id}`, {
        method: "DELETE",
      });
      // Map message to error for consistent error handling
      if (!response.success && response.message && !response.error) {
        return { ...response, error: response.message };
      }
      return response;
    } catch (error) {
      return {
        success: false,
        data: {} as Account,
        error:
          error instanceof Error ? error.message : "Failed to delete account",
      };
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(id: string): Promise<AccountBalanceResponse> {
    return apiFetch<AccountBalanceResponse>(`/accounts/${id}/balance`);
  }

  /**
   * Search accounts by query
   */
  async searchAccounts(query: string): Promise<AccountsResponse> {
    return apiFetch<AccountsResponse>(
      `/accounts/search?q=${encodeURIComponent(query)}`,
    );
  }

  /**
   * Get chart of accounts
   */
  async getChartOfAccounts(): Promise<ChartOfAccountsResponse> {
    return apiFetch<ChartOfAccountsResponse>("/accounts/chart/view");
  }

  /**
   * Archive an account (soft delete)
   */
  async archiveAccount(id: string): Promise<AccountResponse> {
    try {
      const response = await apiFetch<AccountResponse>(
        `/accounts/${id}/archive`,
        {
          method: "PUT",
        },
      );
      // Map message to error for consistent error handling
      if (!response.success && response.message && !response.error) {
        return { ...response, error: response.message };
      }
      return response;
    } catch (error) {
      return {
        success: false,
        data: {} as Account,
        error:
          error instanceof Error ? error.message : "Failed to archive account",
      };
    }
  }

  /**
   * Restore an archived account
   */
  async restoreAccount(id: string): Promise<AccountResponse> {
    try {
      const response = await apiFetch<AccountResponse>(
        `/accounts/${id}/restore`,
        {
          method: "PUT",
        },
      );
      // Map message to error for consistent error handling
      if (!response.success && response.message && !response.error) {
        return { ...response, error: response.message };
      }
      return response;
    } catch (error) {
      return {
        success: false,
        data: {} as Account,
        error:
          error instanceof Error ? error.message : "Failed to restore account",
      };
    }
  }

  /**
   * Reconcile account balance with ledger
   */
  async reconcileAccountBalance(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data: {
      accountId: string;
      accountCode: string;
      accountName: string;
      previousBalance?: number;
      actualBalance?: number;
      difference?: number;
      reconciled: boolean;
      balance?: number;
    };
  }> {
    try {
      return await apiFetch(`/accounts/${id}/reconcile`, {
        method: "POST",
      });
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to reconcile account",
        data: {
          accountId: id,
          accountCode: "",
          accountName: "",
          reconciled: false,
        },
      };
    }
  }

  /**
   * Reconcile all account balances
   */
  async reconcileAllAccountBalances(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data: {
      totalAccounts: number;
      reconciledCount: number;
      inSyncCount: number;
      totalDifference: number;
      results: any[];
    };
  }> {
    try {
      return await apiFetch(`/accounts/reconcile-all`, {
        method: "POST",
      });
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to reconcile accounts",
        data: {
          totalAccounts: 0,
          reconciledCount: 0,
          inSyncCount: 0,
          totalDifference: 0,
          results: [],
        },
      };
    }
  }
}

export const accountsService = new AccountsService();
