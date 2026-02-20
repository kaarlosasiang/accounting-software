import { apiFetch } from "@/lib/config/api-client";

export interface BankAccountInfo {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  linkedAccountId?: string;
  isActive: boolean;
  notes?: string;
}

export interface BankingSettings {
  accounts: BankAccountInfo[];
}

export interface CompanySettings {
  _id: string;
  companyId: string;
  general: any;
  accounting: any;
  invoicing: any;
  billing: any;
  payment: any;
  banking: BankingSettings;
  reporting: any;
  notifications: any;
  updatedAt: Date | string;
}

export interface CompanySettingsResponse {
  success: boolean;
  data: CompanySettings;
  message?: string;
  error?: string;
}

class CompanySettingsService {
  /**
   * Get company settings
   */
  async getCompanySettings(): Promise<CompanySettingsResponse> {
    return apiFetch<CompanySettingsResponse>("/company-settings");
  }

  /**
   * Update general settings
   */
  async updateGeneralSettings(
    generalData: any,
  ): Promise<CompanySettingsResponse> {
    return apiFetch<CompanySettingsResponse>("/company-settings/general", {
      method: "PUT",
      body: JSON.stringify(generalData),
    });
  }

  /**
   * Add bank account
   */
  async addBankAccount(
    bankAccountData: Omit<BankAccountInfo, "id">,
  ): Promise<CompanySettingsResponse> {
    return apiFetch<CompanySettingsResponse>(
      "/company-settings/banking/accounts",
      {
        method: "POST",
        body: JSON.stringify(bankAccountData),
      },
    );
  }

  /**
   * Update bank account
   */
  async updateBankAccount(
    accountId: string,
    bankAccountData: Partial<BankAccountInfo>,
  ): Promise<CompanySettingsResponse> {
    return apiFetch<CompanySettingsResponse>(
      `/company-settings/banking/accounts/${accountId}`,
      {
        method: "PUT",
        body: JSON.stringify(bankAccountData),
      },
    );
  }

  /**
   * Remove bank account
   */
  async removeBankAccount(accountId: string): Promise<CompanySettingsResponse> {
    return apiFetch<CompanySettingsResponse>(
      `/company-settings/banking/accounts/${accountId}`,
      {
        method: "DELETE",
      },
    );
  }

  /**
   * Get specific bank account
   */
  async getBankAccount(accountId: string): Promise<{
    success: boolean;
    data: BankAccountInfo;
    message?: string;
    error?: string;
  }> {
    return apiFetch<{
      success: boolean;
      data: BankAccountInfo;
      message?: string;
      error?: string;
    }>(`/company-settings/banking/accounts/${accountId}`);
  }
}

export const companySettingsService = new CompanySettingsService();
