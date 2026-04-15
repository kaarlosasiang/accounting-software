import { apiFetch } from "@/lib/config/api-client";

export interface DashboardKPIs {
  ytdRevenue: number;
  monthRevenue: number;
  ytdExpenses: number;
  monthExpenses: number;
  ytdProfit: number;
  monthProfit: number;
}

export interface DashboardOutstanding {
  count: number;
  totalBalance: number;
  overdueCount: number;
}

export interface DashboardTransaction {
  _id: string;
  date: string;
  description: string;
  accountName: string;
  accountCode: string;
  debit: number;
  credit: number;
  type: string;
}

export interface DashboardMonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface DashboardOverview {
  kpis: DashboardKPIs;
  outstandingInvoices: DashboardOutstanding;
  outstandingBills: DashboardOutstanding;
  recentTransactions: DashboardTransaction[];
  monthlyTrend: DashboardMonthlyTrend[];
}

export const dashboardService = {
  async getOverview(): Promise<{ success: boolean; data: DashboardOverview }> {
    return apiFetch("/dashboard/overview");
  },
};
