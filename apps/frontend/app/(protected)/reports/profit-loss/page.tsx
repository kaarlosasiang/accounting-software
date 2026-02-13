"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Download, FileText, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/config/api-client";

interface AccountItem {
  accountCode: string;
  accountName: string;
  subType?: string;
  amount: number;
}

interface IncomeStatementData {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    operatingRevenue: AccountItem[];
    otherIncome: AccountItem[];
    total: number;
  };
  expenses: {
    costOfSales: AccountItem[];
    operatingExpenses: AccountItem[];
    nonOperatingExpenses: AccountItem[];
    total: number;
  };
  summary: {
    grossRevenue: number;
    costOfSales: number;
    grossProfit: number;
    operatingExpenses: number;
    operatingIncome: number;
    otherIncome: number;
    nonOperatingExpenses: number;
    netIncome: number;
  };
}

export default function ProfitLossPage() {
  const [data, setData] = useState<IncomeStatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("ytd"); // ytd, month, quarter, custom

  // Calculate date range based on period
  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case "ytd":
        startDate = new Date(endDate.getFullYear(), 0, 1); // Jan 1
        break;
      case "month":
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(endDate.getMonth() / 3);
        startDate = new Date(endDate.getFullYear(), quarter * 3, 1);
        break;
      default:
        startDate = new Date(endDate.getFullYear(), 0, 1);
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  useEffect(() => {
    async function fetchIncomeStatement() {
      setLoading(true);
      setError(null);
      try {
        const { startDate, endDate } = getDateRange();
        const result = await apiFetch<{
          success: boolean;
          data: IncomeStatementData;
        }>(
          `/reports/income-statement?startDate=${startDate}&endDate=${endDate}`,
        );
        setData(result.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load income statement",
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchIncomeStatement();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive">Error: {error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Profit & Loss Statement
          </h1>
          <p className="text-muted-foreground text-sm">
            Income and expenses for the selected period
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Profit & Loss Statement</CardTitle>
          </div>
          <CardDescription>
            {new Date(data.period.startDate).toLocaleDateString()} -{" "}
            {new Date(data.period.endDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Revenue Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-green-600">
                Revenue
              </h3>

              {/* Operating Revenue */}
              {data.revenue.operatingRevenue.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Operating Revenue
                  </h4>
                  <Table>
                    <TableBody>
                      {data.revenue.operatingRevenue.map((account) => (
                        <TableRow key={account.accountCode}>
                          <TableCell className="font-medium">
                            {account.accountName}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">
                            {formatCurrency(account.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Other Income */}
              {data.revenue.otherIncome.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Other Income
                  </h4>
                  <Table>
                    <TableBody>
                      {data.revenue.otherIncome.map((account) => (
                        <TableRow key={account.accountCode}>
                          <TableCell className="font-medium">
                            {account.accountName}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">
                            {formatCurrency(account.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Table>
                <TableBody>
                  <TableRow className="border-t-2 bg-green-50 dark:bg-green-950/20">
                    <TableCell className="font-bold">Total Revenue</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(data.revenue.total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Expenses Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-red-600">
                Expenses
              </h3>

              {/* Cost of Sales */}
              {data.expenses.costOfSales.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Cost of Goods Sold
                  </h4>
                  <Table>
                    <TableBody>
                      {data.expenses.costOfSales.map((account) => (
                        <TableRow key={account.accountCode}>
                          <TableCell className="font-medium">
                            {account.accountName}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(account.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/30">
                        <TableCell className="font-semibold">
                          Total Cost of Sales
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          {formatCurrency(data.summary.costOfSales)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Gross Profit */}
              {data.summary.grossProfit !== 0 && (
                <Table className="mb-4">
                  <TableBody>
                    <TableRow className="bg-blue-50 dark:bg-blue-950/20">
                      <TableCell className="font-bold">Gross Profit</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        {formatCurrency(data.summary.grossProfit)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}

              {/* Operating Expenses */}
              {data.expenses.operatingExpenses.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Operating Expenses
                  </h4>
                  <Table>
                    <TableBody>
                      {data.expenses.operatingExpenses.map((account) => (
                        <TableRow key={account.accountCode}>
                          <TableCell className="font-medium">
                            {account.accountName}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(account.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/30">
                        <TableCell className="font-semibold">
                          Total Operating Expenses
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          {formatCurrency(data.summary.operatingExpenses)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Operating Income */}
              {data.summary.operatingIncome !== 0 && (
                <Table className="mb-4">
                  <TableBody>
                    <TableRow className="bg-blue-50 dark:bg-blue-950/20">
                      <TableCell className="font-bold">
                        Operating Income
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        {formatCurrency(data.summary.operatingIncome)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}

              {/* Non-Operating Expenses */}
              {data.expenses.nonOperatingExpenses.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Non-Operating Expenses
                  </h4>
                  <Table>
                    <TableBody>
                      {data.expenses.nonOperatingExpenses.map((account) => (
                        <TableRow key={account.accountCode}>
                          <TableCell className="font-medium">
                            {account.accountName}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(account.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Table>
                <TableBody>
                  <TableRow className="border-t-2 bg-red-50 dark:bg-red-950/20">
                    <TableCell className="font-bold">Total Expenses</TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {formatCurrency(data.expenses.total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Net Income */}
            <div className="pt-4 border-t-4">
              <Table>
                <TableBody>
                  <TableRow className="bg-primary/5">
                    <TableCell className="text-xl font-bold">
                      Net Income
                    </TableCell>
                    <TableCell
                      className={`text-right text-xl font-bold ${
                        data.summary.netIncome >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(data.summary.netIncome)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {data.summary.netIncome >= 0 ? "✓ Profitable" : "⚠ Net Loss"}{" "}
                for the selected period
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
