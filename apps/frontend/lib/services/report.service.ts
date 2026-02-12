import { apiFetch } from "@/lib/config/api-client";

// AR Aging Report Types
export interface ARAgingInvoice {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  issueDate: Date;
  dueDate: Date;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  daysOverdue: number;
  ageBucket: "Current" | "1-30" | "31-60" | "61-90" | "90+";
}

export interface ARAgingCustomer {
  customerId: string;
  customerName: string;
  invoices: ARAgingInvoice[];
  totals: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90plus: number;
    total: number;
  };
}

export interface ARAgingReport {
  asOfDate: Date;
  customers: ARAgingCustomer[];
  grandTotals: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90plus: number;
    total: number;
  };
  summary: {
    totalInvoices: number;
    totalCustomers: number;
    totalOutstanding: number;
  };
}

// AP Aging Report Types
export interface APAgingBill {
  billNumber: string;
  supplierId: string;
  supplierName: string;
  billDate: Date;
  dueDate: Date;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  daysOverdue: number;
  ageBucket: "Current" | "1-30" | "31-60" | "61-90" | "90+";
}

export interface APAgingSupplier {
  supplierId: string;
  supplierName: string;
  bills: APAgingBill[];
  totals: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90plus: number;
    total: number;
  };
}

export interface APAgingReport {
  asOfDate: Date;
  suppliers: APAgingSupplier[];
  grandTotals: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90plus: number;
    total: number;
  };
  summary: {
    totalBills: number;
    totalSuppliers: number;
    totalOutstanding: number;
  };
}

export interface ReportResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

class ReportService {
  /**
   * Generate Accounts Receivable Aging Report
   */
  async getARAgingReport(
    asOfDate?: string,
  ): Promise<ReportResponse<ARAgingReport>> {
    const params = asOfDate ? `?asOfDate=${asOfDate}` : "";
    return apiFetch<ReportResponse<ARAgingReport>>(
      `/reports/ar-aging${params}`,
    );
  }

  /**
   * Generate Accounts Payable Aging Report
   */
  async getAPAgingReport(
    asOfDate?: string,
  ): Promise<ReportResponse<APAgingReport>> {
    const params = asOfDate ? `?asOfDate=${asOfDate}` : "";
    return apiFetch<ReportResponse<APAgingReport>>(
      `/reports/ap-aging${params}`,
    );
  }

  /**
   * Generate Balance Sheet
   */
  async getBalanceSheet(asOfDate?: string): Promise<ReportResponse<any>> {
    const params = asOfDate ? `?asOfDate=${asOfDate}` : "";
    return apiFetch<ReportResponse<any>>(`/reports/balance-sheet${params}`);
  }

  /**
   * Generate Income Statement
   */
  async getIncomeStatement(
    startDate?: string,
    endDate?: string,
  ): Promise<ReportResponse<any>> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const queryString = params.toString();
    return apiFetch<ReportResponse<any>>(
      `/reports/income-statement${queryString ? `?${queryString}` : ""}`,
    );
  }

  /**
   * Generate Cash Flow Statement
   */
  async getCashFlowStatement(
    startDate?: string,
    endDate?: string,
  ): Promise<ReportResponse<any>> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const queryString = params.toString();
    return apiFetch<ReportResponse<any>>(
      `/reports/cash-flow${queryString ? `?${queryString}` : ""}`,
    );
  }

  /**
   * Generate Trial Balance
   */
  async getTrialBalance(asOfDate?: string): Promise<ReportResponse<any>> {
    const params = asOfDate ? `?asOfDate=${asOfDate}` : "";
    return apiFetch<ReportResponse<any>>(`/reports/trial-balance${params}`);
  }
}

export const reportService = new ReportService();
