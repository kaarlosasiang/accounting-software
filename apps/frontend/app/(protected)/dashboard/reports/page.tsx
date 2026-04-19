"use client";

import {
  ArrowRight,
  BarChart3,
  Calculator,
  FileText,
  PieChart,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/use-dashboard";
import { useReports } from "@/hooks/use-reports";
import { formatCurrency } from "@/lib/utils";

// Types matching the API response shapes
interface AccountItem {
  accountCode: string;
  accountName: string;
  balance: number;
}

interface BalanceSheetData {
  asOfDate: string;
  assets: {
    currentAssets: AccountItem[];
    fixedAssets: AccountItem[];
    otherAssets: AccountItem[];
    total: number;
  };
  liabilities: {
    currentLiabilities: AccountItem[];
    longTermLiabilities: AccountItem[];
    otherLiabilities: AccountItem[];
    total: number;
  };
  equity: {
    accounts: AccountItem[];
    total: number;
  };
  balanced: boolean;
}

interface CashFlowStatementData {
  operatingActivities: { netIncome: number; total: number };
  investingActivities: { total: number };
  financingActivities: { total: number };
  summary: {
    netCashFlow: number;
    beginningCash: number;
    endingCash: number;
  };
}

export default function DashboardReportsPage() {
  const { data, isLoading: dashboardLoading } = useDashboard();
  const { fetchBalanceSheet, fetchCashFlowStatement } = useReports();

  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(
    null,
  );
  const [cashFlow, setCashFlow] = useState<CashFlowStatementData | null>(null);
  const [bsLoading, setBsLoading] = useState(true);
  const [cfLoading, setCfLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const startOfYear = `${new Date().getFullYear()}-01-01`;

    setBsLoading(true);
    fetchBalanceSheet(today)
      .then((result) => {
        if (result) setBalanceSheet(result as BalanceSheetData);
      })
      .finally(() => setBsLoading(false));

    setCfLoading(true);
    fetchCashFlowStatement(startOfYear, today)
      .then((result) => {
        if (result) setCashFlow(result as CashFlowStatementData);
      })
      .finally(() => setCfLoading(false));
  }, [fetchBalanceSheet, fetchCashFlowStatement]);

  const ytdRevenue = data?.kpis?.ytdRevenue ?? 0;
  const ytdProfit = data?.kpis?.ytdProfit ?? 0;
  const ytdExpenses = data?.kpis?.ytdExpenses ?? 0;
  const netMarginPct =
    ytdRevenue > 0 ? ((ytdProfit / ytdRevenue) * 100).toFixed(1) : null;
  const arBalance = data?.outstandingInvoices?.totalBalance ?? 0;
  const apBalance = data?.outstandingBills?.totalBalance ?? 0;
  const arOverdue = data?.outstandingInvoices?.overdueCount ?? 0;
  const apOverdue = data?.outstandingBills?.overdueCount ?? 0;

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Dashboard Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Consolidated financial statements & performance summaries
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports">
              <FileText className="h-4 w-4 mr-2" /> View All Reports
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue (YTD)
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(ytdRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Expenses: {formatCurrency(ytdExpenses)}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Profit (YTD)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <>
                <div
                  className={`text-2xl font-bold ${ytdProfit < 0 ? "text-destructive" : ""}`}
                >
                  {formatCurrency(ytdProfit)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {netMarginPct !== null
                    ? `Net Margin: ${netMarginPct}%`
                    : "No revenue yet"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding A/R
            </CardTitle>
            <Calculator className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(arBalance)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {arOverdue > 0 ? (
                    <span className="text-destructive">
                      {arOverdue} overdue
                    </span>
                  ) : (
                    "No overdue invoices"
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding A/P
            </CardTitle>
            <PieChart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(apBalance)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {apOverdue > 0 ? (
                    <span className="text-destructive">
                      {apOverdue} overdue
                    </span>
                  ) : (
                    "No overdue bills"
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly P&L Table */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle>Monthly Performance (YTD)</CardTitle>
          <CardDescription>Revenue, expenses and profit by month</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {dashboardLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : !data?.monthlyTrend?.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No transactions recorded yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 text-left font-medium">Month</th>
                    <th className="py-2 text-left font-medium">Revenue</th>
                    <th className="py-2 text-left font-medium">Expenses</th>
                    <th className="py-2 text-left font-medium">Net Profit</th>
                    <th className="py-2 text-left font-medium">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthlyTrend.map((row) => (
                    <tr
                      key={row.month}
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-2 font-medium">{row.month}</td>
                      <td className="py-2">{formatCurrency(row.revenue)}</td>
                      <td className="py-2 text-red-600">
                        {formatCurrency(row.expenses)}
                      </td>
                      <td
                        className={`py-2 font-semibold ${row.profit < 0 ? "text-destructive" : "text-green-600"}`}
                      >
                        {formatCurrency(row.profit)}
                      </td>
                      <td className="py-2">
                        {row.revenue > 0
                          ? `${((row.profit / row.revenue) * 100).toFixed(1)}%`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td className="py-2">YTD Total</td>
                    <td className="py-2">{formatCurrency(ytdRevenue)}</td>
                    <td className="py-2 text-red-600">
                      {formatCurrency(ytdExpenses)}
                    </td>
                    <td
                      className={`py-2 ${ytdProfit < 0 ? "text-destructive" : "text-green-600"}`}
                    >
                      {formatCurrency(ytdProfit)}
                    </td>
                    <td className="py-2">
                      {netMarginPct !== null ? `${netMarginPct}%` : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balance Sheet Snapshot */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-start justify-between border-b border-border/50 bg-muted/30">
          <div>
            <CardTitle>Balance Sheet Snapshot</CardTitle>
            <CardDescription>
              Assets, liabilities &amp; equity as of today
            </CardDescription>
          </div>
          {balanceSheet && (
            <Badge
              variant="outline"
              className={
                balanceSheet.balanced
                  ? "text-green-600 bg-green-500/10"
                  : "text-destructive"
              }
            >
              {balanceSheet.balanced ? "Balanced" : "Out of Balance"}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {bsLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 w-full" />
                  ))}
                </div>
              ))}
            </div>
          ) : !balanceSheet ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No chart of accounts data available
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Assets */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Assets</h4>
                {(
                  [
                    {
                      label: "Current Assets",
                      items: balanceSheet.assets.currentAssets,
                    },
                    {
                      label: "Fixed Assets",
                      items: balanceSheet.assets.fixedAssets,
                    },
                    {
                      label: "Other Assets",
                      items: balanceSheet.assets.otherAssets,
                    },
                  ] as const
                ).map(({ label, items }) =>
                  items.length > 0 ? (
                    <div key={label}>
                      <p className="mb-1 text-xs text-muted-foreground">
                        {label}
                      </p>
                      <ul className="space-y-1 text-sm">
                        {items.map((a) => (
                          <li key={a.accountCode} className="flex justify-between">
                            <span className="truncate pr-2 text-muted-foreground">
                              {a.accountName}
                            </span>
                            <span className="whitespace-nowrap font-medium">
                              {formatCurrency(a.balance)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null,
                )}
                <div className="flex justify-between border-t pt-2 text-sm font-semibold">
                  <span>Total Assets</span>
                  <span>{formatCurrency(balanceSheet.assets.total)}</span>
                </div>
              </div>

              {/* Liabilities */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Liabilities</h4>
                {(
                  [
                    {
                      label: "Current Liabilities",
                      items: balanceSheet.liabilities.currentLiabilities,
                    },
                    {
                      label: "Long-term Liabilities",
                      items: balanceSheet.liabilities.longTermLiabilities,
                    },
                    {
                      label: "Other Liabilities",
                      items: balanceSheet.liabilities.otherLiabilities,
                    },
                  ] as const
                ).map(({ label, items }) =>
                  items.length > 0 ? (
                    <div key={label}>
                      <p className="mb-1 text-xs text-muted-foreground">
                        {label}
                      </p>
                      <ul className="space-y-1 text-sm">
                        {items.map((a) => (
                          <li key={a.accountCode} className="flex justify-between">
                            <span className="truncate pr-2 text-muted-foreground">
                              {a.accountName}
                            </span>
                            <span className="whitespace-nowrap font-medium">
                              {formatCurrency(a.balance)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null,
                )}
                <div className="flex justify-between border-t pt-2 text-sm font-semibold">
                  <span>Total Liabilities</span>
                  <span>{formatCurrency(balanceSheet.liabilities.total)}</span>
                </div>
              </div>

              {/* Equity */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Equity</h4>
                <ul className="space-y-1 text-sm">
                  {balanceSheet.equity.accounts.map((a) => (
                    <li key={a.accountCode} className="flex justify-between">
                      <span className="truncate pr-2 text-muted-foreground">
                        {a.accountName}
                      </span>
                      <span className="whitespace-nowrap font-medium">
                        {formatCurrency(a.balance)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between border-t pt-2 text-sm font-semibold">
                  <span>Total Equity</span>
                  <span>{formatCurrency(balanceSheet.equity.total)}</span>
                </div>
              </div>
            </div>
          )}
          {balanceSheet && (
            <div className="mt-4 flex justify-end border-t pt-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/reports/balance-sheet">
                  View Full Balance Sheet{" "}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cash Flow Summary */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle>Cash Flow Summary (YTD)</CardTitle>
          <CardDescription>
            Operating, investing &amp; financing activities
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {cfLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : !cashFlow ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No cash flow data available
            </p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {(
                  [
                    {
                      label: "Operating Activities",
                      value: cashFlow.operatingActivities.total,
                      desc: `Net income: ${formatCurrency(cashFlow.operatingActivities.netIncome)}`,
                    },
                    {
                      label: "Investing Activities",
                      value: cashFlow.investingActivities.total,
                      desc: "Capital expenditures & asset sales",
                    },
                    {
                      label: "Financing Activities",
                      value: cashFlow.financingActivities.total,
                      desc: "Debt & equity changes",
                    },
                  ] as const
                ).map(({ label, value, desc }) => (
                  <div
                    key={label}
                    className="rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/30"
                  >
                    <p className="mb-1 text-xs text-muted-foreground">
                      {label}
                    </p>
                    <p
                      className={`text-xl font-bold ${value < 0 ? "text-destructive" : "text-green-600"}`}
                    >
                      {formatCurrency(value)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/30 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Net Cash Flow (YTD)
                  </p>
                  <p
                    className={`text-lg font-bold ${cashFlow.summary.netCashFlow < 0 ? "text-destructive" : "text-green-600"}`}
                  >
                    {formatCurrency(cashFlow.summary.netCashFlow)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    cashFlow.summary.netCashFlow >= 0
                      ? "text-green-600 bg-green-500/10"
                      : "text-destructive"
                  }
                >
                  {cashFlow.summary.netCashFlow >= 0
                    ? "Positive Cash Flow"
                    : "Negative Cash Flow"}
                </Badge>
              </div>
              <div className="mt-4 flex justify-end border-t pt-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/reports/cash-flow">
                    View Full Cash Flow <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tax Summary — links to dedicated page */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle>Tax Summary</CardTitle>
          <CardDescription>
            Philippines TRAIN Law graduated income tax computation
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <p className="max-w-md text-sm text-muted-foreground">
            View quarterly taxable income, applicable BIR rates, and amounts due
            or paid in the dedicated Tax Summary report.
          </p>
          <Button asChild>
            <Link href="/reports/tax-summary">
              <FileText className="mr-2 h-4 w-4" />
              Open Tax Summary
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
