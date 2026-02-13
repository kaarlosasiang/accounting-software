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
import { Download, Calendar, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/config/api-client";

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
  equation: {
    assets: number;
    liabilities: number;
    equity: number;
    difference: number;
  };
}

export default function BalanceSheetPage() {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    async function fetchBalanceSheet() {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch<{
          success: boolean;
          data: BalanceSheetData;
        }>(`/reports/balance-sheet?asOfDate=${selectedDate}`);
        setData(result.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load balance sheet",
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchBalanceSheet();
  }, [selectedDate]);

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

  // Calculate key ratios
  const currentAssetTotal = data.assets.currentAssets.reduce(
    (sum, a) => sum + a.balance,
    0,
  );
  const currentLiabilityTotal = data.liabilities.currentLiabilities.reduce(
    (sum, l) => sum + l.balance,
    0,
  );
  const currentRatio =
    currentLiabilityTotal !== 0 ? currentAssetTotal / currentLiabilityTotal : 0;
  const debtToEquityRatio =
    data.equity.total !== 0 ? data.liabilities.total / data.equity.total : 0;
  const workingCapital = currentAssetTotal - currentLiabilityTotal;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Balance Sheet
          </h1>
          <p className="text-muted-foreground text-sm">
            Financial position snapshot - Assets, Liabilities, and Equity
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="2025">
            <SelectTrigger className="w-[120px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
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
          <CardTitle>
            Balance Sheet as of {new Date(data.asOfDate).toLocaleDateString()}
          </CardTitle>
          <CardDescription>
            A comprehensive view of your financial position
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Assets Section */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">ASSETS</h3>

              {/* Current Assets */}
              {data.assets.currentAssets.length > 0 && (
                <div className="ml-4 mb-6">
                  <h4 className="text-lg font-semibold mb-3">Current Assets</h4>
                  <Table>
                    <TableBody>
                      {data.assets.currentAssets.map((account) => (
                        <TableRow
                          key={account.accountCode}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="pl-8">
                            {account.accountName}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(account.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t bg-muted/30">
                        <TableCell className="pl-4 font-semibold">
                          Total Current Assets
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(currentAssetTotal)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Fixed Assets */}
              {data.assets.fixedAssets.length > 0 && (
                <div className="ml-4 mb-6">
                  <h4 className="text-lg font-semibold mb-3">Fixed Assets</h4>
                  <Table>
                    <TableBody>
                      {data.assets.fixedAssets.map((account) => (
                        <TableRow
                          key={account.accountCode}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="pl-8">
                            {account.accountName}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              account.balance < 0 ? "text-red-600" : ""
                            }`}
                          >
                            {account.balance < 0
                              ? `(${formatCurrency(Math.abs(account.balance))})`
                              : formatCurrency(account.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t bg-muted/30">
                        <TableCell className="pl-4 font-semibold">
                          Total Fixed Assets
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            data.assets.fixedAssets.reduce(
                              (sum, a) => sum + a.balance,
                              0,
                            ),
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Other Assets */}
              {data.assets.otherAssets.length > 0 && (
                <div className="ml-4 mb-6">
                  <h4 className="text-lg font-semibold mb-3">Other Assets</h4>
                  <Table>
                    <TableBody>
                      {data.assets.otherAssets.map((account) => (
                        <TableRow
                          key={account.accountCode}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="pl-8">
                            {account.accountName}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(account.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t bg-muted/30">
                        <TableCell className="pl-4 font-semibold">
                          Total Other Assets
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            data.assets.otherAssets.reduce(
                              (sum, a) => sum + a.balance,
                              0,
                            ),
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              <Table>
                <TableBody>
                  <TableRow className="border-t-2 bg-blue-50 dark:bg-blue-950/20">
                    <TableCell className="text-lg font-bold">
                      TOTAL ASSETS
                    </TableCell>
                    <TableCell className="text-right text-lg font-bold text-blue-600">
                      {formatCurrency(data.assets.total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Liabilities Section */}
            <div className="pt-8 border-t-2">
              <h3 className="text-xl font-bold mb-4 text-red-600">
                LIABILITIES
              </h3>

              {/* Current Liabilities */}
              {data.liabilities.currentLiabilities.length > 0 && (
                <div className="ml-4 mb-6">
                  <h4 className="text-lg font-semibold mb-3">
                    Current Liabilities
                  </h4>
                  <Table>
                    <TableBody>
                      {data.liabilities.currentLiabilities.map((account) => (
                        <TableRow
                          key={account.accountCode}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="pl-8">
                            {account.accountName}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(account.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t bg-muted/30">
                        <TableCell className="pl-4 font-semibold">
                          Total Current Liabilities
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(currentLiabilityTotal)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Long-term Liabilities */}
              {data.liabilities.longTermLiabilities.length > 0 && (
                <div className="ml-4 mb-6">
                  <h4 className="text-lg font-semibold mb-3">
                    Long-term Liabilities
                  </h4>
                  <Table>
                    <TableBody>
                      {data.liabilities.longTermLiabilities.map((account) => (
                        <TableRow
                          key={account.accountCode}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="pl-8">
                            {account.accountName}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(account.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t bg-muted/30">
                        <TableCell className="pl-4 font-semibold">
                          Total Long-term Liabilities
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            data.liabilities.longTermLiabilities.reduce(
                              (sum, l) => sum + l.balance,
                              0,
                            ),
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Other Liabilities */}
              {data.liabilities.otherLiabilities.length > 0 && (
                <div className="ml-4 mb-6">
                  <h4 className="text-lg font-semibold mb-3">
                    Other Liabilities
                  </h4>
                  <Table>
                    <TableBody>
                      {data.liabilities.otherLiabilities.map((account) => (
                        <TableRow
                          key={account.accountCode}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="pl-8">
                            {account.accountName}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(account.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t bg-muted/30">
                        <TableCell className="pl-4 font-semibold">
                          Total Other Liabilities
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            data.liabilities.otherLiabilities.reduce(
                              (sum, l) => sum + l.balance,
                              0,
                            ),
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              <Table>
                <TableBody>
                  <TableRow className="border-t-2 bg-red-50 dark:bg-red-950/20">
                    <TableCell className="text-lg font-bold">
                      TOTAL LIABILITIES
                    </TableCell>
                    <TableCell className="text-right text-lg font-bold text-red-600">
                      {formatCurrency(data.liabilities.total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Equity Section */}
            <div className="pt-8 border-t-2">
              <h3 className="text-xl font-bold mb-4 text-green-600">EQUITY</h3>
              <div className="ml-4">
                <Table>
                  <TableBody>
                    {data.equity.accounts.map((account) => (
                      <TableRow
                        key={account.accountCode}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="pl-8">
                          {account.accountName}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(account.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 bg-green-50 dark:bg-green-950/20">
                      <TableCell className="text-lg font-bold">
                        TOTAL EQUITY
                      </TableCell>
                      <TableCell className="text-right text-lg font-bold text-green-600">
                        {formatCurrency(data.equity.total)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Balance Check */}
            <div className="pt-8 border-t-4">
              <Table>
                <TableBody>
                  <TableRow className="bg-primary/5">
                    <TableCell className="text-xl font-bold">
                      TOTAL LIABILITIES & EQUITY
                    </TableCell>
                    <TableCell className="text-right text-xl font-bold text-primary">
                      {formatCurrency(
                        data.liabilities.total + data.equity.total,
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p
                className={`text-xs mt-2 text-center ${
                  data.balanced
                    ? "text-green-600"
                    : "text-destructive font-semibold"
                }`}
              >
                {data.balanced ? (
                  "✓ Balance Sheet is balanced (Assets = Liabilities + Equity)"
                ) : (
                  <>
                    ⚠ Balance Sheet is NOT balanced (Difference:{" "}
                    {formatCurrency(Math.abs(data.equation.difference))})
                  </>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Ratios */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentLiabilityTotal !== 0 ? currentRatio.toFixed(2) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current Assets / Current Liabilities
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Debt-to-Equity Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.equity.total !== 0 ? debtToEquityRatio.toFixed(2) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total Liabilities / Total Equity
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Working Capital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                workingCapital >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(workingCapital)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current Assets - Current Liabilities
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
