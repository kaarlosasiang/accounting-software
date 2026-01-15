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
    return apiFetch<AccountResponse>("/accounts", {
      method: "POST",
      body: JSON.stringify(accountData),
    });
  }

  /**
   * Update an existing account
   */
  async updateAccount(
    id: string,
    updateData: Partial<Account>
  ): Promise<AccountResponse> {
    return apiFetch<AccountResponse>(`/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Delete an account
   */
  async deleteAccount(id: string): Promise<AccountResponse> {
    return apiFetch<AccountResponse>(`/accounts/${id}`, {
      method: "DELETE",
    });
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
      `/accounts/search?q=${encodeURIComponent(query)}`
    );
  }

  /**
   * Get chart of accounts
   */
  async getChartOfAccounts(): Promise<ChartOfAccountsResponse> {
    return apiFetch<ChartOfAccountsResponse>("/accounts/chart/view");
  }
}

export const accountsService = new AccountsService();
