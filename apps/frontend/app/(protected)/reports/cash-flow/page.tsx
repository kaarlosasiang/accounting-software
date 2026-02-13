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
import { Download, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/config/api-client";

interface CashFlowItem {
  accountName: string;
  accountCode: string;
  change?: number;
  cashEffect?: number;
  purchases?: number;
  sales?: number;
  netCashEffect?: number;
  increases?: number;
  decreases?: number;
}

interface CashFlowStatementData {
  period: {
    startDate: string;
    endDate: string;
  };
  operatingActivities: {
    netIncome: number;
    adjustments: CashFlowItem[];
    total: number;
  };
  investingActivities: {
    items: CashFlowItem[];
    total: number;
  };
  financingActivities: {
    items: CashFlowItem[];
    total: number;
  };
  summary: {
    netCashFlow: number;
    beginningCash: number;
    endingCash: number;
    calculatedEndingCash: number;
  };
}

export default function CashFlowPage() {
  const [data, setData] = useState<CashFlowStatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("ytd");

  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case "ytd":
        startDate = new Date(endDate.getFullYear(), 0, 1);
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
    async function fetchCashFlow() {
      setLoading(true);
      setError(null);
      try {
        const { startDate, endDate } = getDateRange();
        const result = await apiFetch<{
          success: boolean;
          data: CashFlowStatementData;
        }>(`/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`);
        setData(result.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load cash flow statement",
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchCashFlow();
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

  // Calculate totals for summary cards
  const totalInflows =
    (data.operatingActivities.total > 0 ? data.operatingActivities.total : 0) +
    (data.investingActivities.total > 0 ? data.investingActivities.total : 0) +
    (data.financingActivities.total > 0 ? data.financingActivities.total : 0);

  const totalOutflows =
    Math.abs(
      data.operatingActivities.total < 0 ? data.operatingActivities.total : 0,
    ) +
    Math.abs(
      data.investingActivities.total < 0 ? data.investingActivities.total : 0,
    ) +
    Math.abs(
      data.financingActivities.total < 0 ? data.financingActivities.total : 0,
    );

  const totalActivity = totalInflows + totalOutflows;
  const inflowPercentage =
    totalActivity > 0 ? (totalInflows / totalActivity) * 100 : 50;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Cash Flow Statement
          </h1>
          <p className="text-muted-foreground text-sm">
            Track the movement of cash in and out of your business
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Cash Inflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalInflows)}
            </div>
            <Progress value={inflowPercentage} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {inflowPercentage.toFixed(0)}% of total activity
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Cash Outflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalOutflows)}
            </div>
            <Progress value={100 - inflowPercentage} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {(100 - inflowPercentage).toFixed(0)}% of total activity
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.summary.netCashFlow >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(data.summary.netCashFlow)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.summary.netCashFlow >= 0
                ? "Positive cash flow"
                : "Negative cash flow"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ending Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.endingCash)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              As of {new Date(data.period.endDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Cash Flow Statement - {new Date().getFullYear()}
          </CardTitle>
          <CardDescription>
            {new Date(data.period.startDate).toLocaleDateString()} -{" "}
            {new Date(data.period.endDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Operating Activities */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-blue-600">
                CASH FLOWS FROM OPERATING ACTIVITIES
              </h3>
              <div className="ml-4">
                <Table>
                  <TableBody>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>Net Income</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          data.operatingActivities.netIncome >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(data.operatingActivities.netIncome)}
                      </TableCell>
                    </TableRow>

                    {data.operatingActivities.adjustments.length > 0 && (
                      <>
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="pt-4 pb-2 text-sm font-semibold"
                          >
                            Adjustments to reconcile net income:
                          </TableCell>
                        </TableRow>
                        {data.operatingActivities.adjustments.map((item) => (
                          <TableRow
                            key={item.accountCode}
                            className="hover:bg-muted/50"
                          >
                            <TableCell className="pl-8">
                              {item.accountName}
                              {item.change !== undefined && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  (Change: {formatCurrency(item.change)})
                                </span>
                              )}
                            </TableCell>
                            <TableCell
                              className={`text-right ${
                                (item.cashEffect ?? 0) >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatCurrency(item.cashEffect ?? 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}

                    <TableRow className="border-t-2 bg-blue-50 dark:bg-blue-950/20">
                      <TableCell className="font-bold">
                        Net Cash from Operating Activities
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold ${
                          data.operatingActivities.total >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(data.operatingActivities.total)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Investing Activities */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-purple-600">
                CASH FLOWS FROM INVESTING ACTIVITIES
              </h3>
              <div className="ml-4">
                <Table>
                  <TableBody>
                    {data.investingActivities.items.length > 0 ? (
                      data.investingActivities.items.map((item) => (
                        <TableRow
                          key={item.accountCode}
                          className="hover:bg-muted/50"
                        >
                          <TableCell>
                            {item.accountName}
                            {item.purchases !== undefined &&
                              item.purchases > 0 && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  (Purchases: {formatCurrency(item.purchases)})
                                </span>
                              )}
                            {item.sales !== undefined && item.sales > 0 && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (Sales: {formatCurrency(item.sales)})
                              </span>
                            )}
                          </TableCell>
                          <TableCell
                            className={`text-right ${
                              (item.netCashEffect ?? 0) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(item.netCashEffect ?? 0)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="text-center text-muted-foreground"
                        >
                          No investing activities for this period
                        </TableCell>
                      </TableRow>
                    )}

                    <TableRow className="border-t-2 bg-purple-50 dark:bg-purple-950/20">
                      <TableCell className="font-bold">
                        Net Cash from Investing Activities
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold ${
                          data.investingActivities.total >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(data.investingActivities.total)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Financing Activities */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-orange-600">
                CASH FLOWS FROM FINANCING ACTIVITIES
              </h3>
              <div className="ml-4">
                <Table>
                  <TableBody>
                    {data.financingActivities.items.length > 0 ? (
                      data.financingActivities.items.map((item) => (
                        <TableRow
                          key={item.accountCode}
                          className="hover:bg-muted/50"
                        >
                          <TableCell>
                            {item.accountName}
                            {item.increases !== undefined &&
                              item.increases > 0 && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  (Increases: {formatCurrency(item.increases)})
                                </span>
                              )}
                            {item.decreases !== undefined &&
                              item.decreases > 0 && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  (Decreases: {formatCurrency(item.decreases)})
                                </span>
                              )}
                          </TableCell>
                          <TableCell
                            className={`text-right ${
                              (item.netCashEffect ?? 0) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(item.netCashEffect ?? 0)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="text-center text-muted-foreground"
                        >
                          No financing activities for this period
                        </TableCell>
                      </TableRow>
                    )}

                    <TableRow className="border-t-2 bg-orange-50 dark:bg-orange-950/20">
                      <TableCell className="font-bold">
                        Net Cash from Financing Activities
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold ${
                          data.financingActivities.total >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(data.financingActivities.total)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Summary */}
            <div className="pt-4 border-t-4">
              <Table>
                <TableBody>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-semibold">
                      Beginning Cash Balance
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(data.summary.beginningCash)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-primary/5">
                    <TableCell className="text-xl font-bold">
                      Net Change in Cash
                    </TableCell>
                    <TableCell
                      className={`text-right text-xl font-bold ${
                        data.summary.netCashFlow >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(data.summary.netCashFlow)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-t-2 bg-blue-50 dark:bg-blue-950/20">
                    <TableCell className="text-xl font-bold">
                      Ending Cash Balance
                    </TableCell>
                    <TableCell className="text-right text-xl font-bold text-blue-600">
                      {formatCurrency(data.summary.endingCash)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
