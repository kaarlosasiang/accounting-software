"use client";

import { useState, useEffect, useCallback } from "react";
import { useReports } from "@/hooks/use-reports";
import { useCurrency } from "@/hooks/use-currency";
import { downloadCsv } from "@/lib/utils/csv-export";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";

type AccountLineItem = {
  accountCode?: string;
  accountName: string;
  amount?: number;
  balance?: number;
  netCashEffect?: number;
  cashEffect?: number;
};

function ReportSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className={`h-9 w-full ${i === 4 ? "h-px" : ""}`} />
      ))}
    </div>
  );
}

function SectionRows({
  items,
  color,
  valueKey = "amount",
  format,
}: {
  items: AccountLineItem[];
  color?: string;
  valueKey?: "amount" | "balance" | "netCashEffect" | "cashEffect";
  format: (v: number) => string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <>
      {items.map((item, i) => {
        const val = (item[valueKey] as number) ?? 0;
        return (
          <TableRow key={i}>
            <TableCell className="pl-8 text-sm">{item.accountName}</TableCell>
            <TableCell
              className={`text-right text-sm ${color ?? ""} ${!color && val < 0 ? "text-red-600" : ""}`}
            >
              {val < 0 ? `(${format(Math.abs(val))})` : format(val)}
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

function TotalRow({
  label,
  value,
  color,
  border = false,
  format,
}: {
  label: string;
  value: number;
  color?: string;
  border?: boolean;
  format: (v: number) => string;
}) {
  return (
    <TableRow className={border ? "border-t-2" : ""}>
      <TableCell className="font-bold">{label}</TableCell>
      <TableCell
        className={`text-right font-bold ${color ?? ""} ${!color && value < 0 ? "text-red-600" : ""}`}
      >
        {value < 0 ? `(${format(Math.abs(value))})` : format(value)}
      </TableCell>
    </TableRow>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear.toString());
  const [activeTab, setActiveTab] = useState("profit-loss");
  const [plData, setPlData] = useState<any>(null);
  const [bsData, setBsData] = useState<any>(null);
  const [cfData, setCfData] = useState<any>(null);

  const {
    fetchIncomeStatement,
    fetchBalanceSheet,
    fetchCashFlowStatement,
    isLoading,
  } = useReports();
  const { formatCurrency: format } = useCurrency();

  const startDate = `${year}-01-01`;
  const endDate =
    year === currentYear.toString()
      ? new Date().toISOString().split("T")[0]
      : `${year}-12-31`;

  const loadReport = useCallback(
    async (tab: string) => {
      if (tab === "profit-loss") {
        const data = await fetchIncomeStatement(startDate, endDate);
        if (data) setPlData(data);
      } else if (tab === "balance-sheet") {
        const data = await fetchBalanceSheet(endDate);
        if (data) setBsData(data);
      } else if (tab === "cash-flow") {
        const data = await fetchCashFlowStatement(startDate, endDate);
        if (data) setCfData(data);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startDate, endDate],
  );

  useEffect(() => {
    loadReport(activeTab);
  }, [activeTab, loadReport]);

  const handleYearChange = (val: string) => {
    setYear(val);
    setPlData(null);
    setBsData(null);
    setCfData(null);
  };

  const handleExport = () => {
    const date = new Date().toISOString().split("T")[0];
    if (activeTab === "profit-loss" && plData) {
      const rows = [
        ...(plData.revenue?.operatingRevenue ?? []).map((r: any) => ({
          Category: "Revenue",
          Account: r.accountName,
          Amount: r.amount ?? 0,
        })),
        ...(plData.expenses?.operatingExpenses ?? []).map((e: any) => ({
          Category: "Operating Expense",
          Account: e.accountName,
          Amount: e.amount ?? 0,
        })),
        ...(plData.expenses?.costOfSales ?? []).map((e: any) => ({
          Category: "Cost of Sales",
          Account: e.accountName,
          Amount: e.amount ?? 0,
        })),
        {
          Category: "Net Income",
          Account: "",
          Amount: plData.summary?.netIncome ?? 0,
        },
      ];
      downloadCsv(`profit-loss-${year}-${date}.csv`, rows);
    } else if (activeTab === "balance-sheet" && bsData) {
      const rows = [
        ...(bsData.assets?.currentAssets ?? []).map((a: any) => ({
          Section: "Assets",
          SubType: "Current",
          Account: a.accountName,
          Balance: a.balance ?? 0,
        })),
        ...(bsData.assets?.fixedAssets ?? []).map((a: any) => ({
          Section: "Assets",
          SubType: "Fixed",
          Account: a.accountName,
          Balance: a.balance ?? 0,
        })),
        ...(bsData.liabilities?.currentLiabilities ?? []).map((a: any) => ({
          Section: "Liabilities",
          SubType: "Current",
          Account: a.accountName,
          Balance: a.balance ?? 0,
        })),
        ...(bsData.equity?.accounts ?? []).map((a: any) => ({
          Section: "Equity",
          SubType: a.subType ?? "",
          Account: a.accountName,
          Balance: a.balance ?? 0,
        })),
      ];
      downloadCsv(`balance-sheet-${year}-${date}.csv`, rows);
    } else if (activeTab === "cash-flow" && cfData) {
      const rows = [
        {
          Activity: "Operating",
          Account: "Net Income",
          Amount: cfData.operatingActivities?.netIncome ?? 0,
        },
        ...(cfData.operatingActivities?.adjustments ?? []).map((a: any) => ({
          Activity: "Operating",
          Account: a.accountName,
          Amount: a.cashEffect ?? 0,
        })),
        {
          Activity: "Operating Total",
          Account: "",
          Amount: cfData.operatingActivities?.total ?? 0,
        },
        ...(cfData.investingActivities?.items ?? []).map((a: any) => ({
          Activity: "Investing",
          Account: a.accountName,
          Amount: a.netCashEffect ?? 0,
        })),
        {
          Activity: "Investing Total",
          Account: "",
          Amount: cfData.investingActivities?.total ?? 0,
        },
        {
          Activity: "Financing Total",
          Account: "",
          Amount: cfData.financingActivities?.total ?? 0,
        },
        {
          Activity: "Net Cash Flow",
          Account: "",
          Amount: cfData.netCashFlow ?? 0,
        },
        {
          Activity: "Ending Cash Balance",
          Account: "",
          Amount: cfData.endingCash ?? 0,
        },
      ];
      downloadCsv(`cash-flow-${year}-${date}.csv`, rows);
    }
  };

  const canExport =
    (activeTab === "profit-loss" && !!plData) ||
    (activeTab === "balance-sheet" && !!bsData) ||
    (activeTab === "cash-flow" && !!cfData);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Financial Reports
          </h1>
          <p className="text-muted-foreground text-sm">
            Comprehensive financial reports and analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={year} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!canExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(t) => setActiveTab(t)}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="profit-loss">Profit &amp; Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
        </TabsList>

        {/* ── P&L ── */}
        <TabsContent value="profit-loss" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit &amp; Loss Statement</CardTitle>
              <CardDescription>
                Jan 1 – {endDate} {year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || !plData ? (
                <ReportSkeleton />
              ) : (
                <div className="space-y-6">
                  {/* Revenue */}
                  <div>
                    <h3 className="text-base font-semibold mb-3">Revenue</h3>
                    <Table>
                      <TableBody>
                        <SectionRows
                          items={plData.revenue?.operatingRevenue ?? []}
                          color="text-green-600"
                          format={format}
                        />
                        <SectionRows
                          items={plData.revenue?.otherIncome ?? []}
                          color="text-green-600"
                          format={format}
                        />
                        {(plData.revenue?.contraRevenue ?? []).length > 0 && (
                          <SectionRows
                            items={plData.revenue.contraRevenue}
                            format={format}
                          />
                        )}
                        <TotalRow
                          label="Total Revenue"
                          value={plData.revenue?.total ?? 0}
                          color="text-green-600"
                          border
                          format={format}
                        />
                      </TableBody>
                    </Table>
                  </div>

                  {/* Cost of Sales */}
                  {(plData.expenses?.costOfSales ?? []).length > 0 && (
                    <div>
                      <h3 className="text-base font-semibold mb-3">
                        Cost of Sales
                      </h3>
                      <Table>
                        <TableBody>
                          <SectionRows
                            items={plData.expenses.costOfSales}
                            color="text-red-600"
                            format={format}
                          />
                          <TotalRow
                            label="Gross Profit"
                            value={plData.summary?.grossProfit ?? 0}
                            border
                            format={format}
                          />
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Operating Expenses */}
                  <div>
                    <h3 className="text-base font-semibold mb-3">
                      Operating Expenses
                    </h3>
                    <Table>
                      <TableBody>
                        <SectionRows
                          items={plData.expenses?.operatingExpenses ?? []}
                          color="text-red-600"
                          format={format}
                        />
                        <SectionRows
                          items={plData.expenses?.nonOperatingExpenses ?? []}
                          color="text-red-600"
                          format={format}
                        />
                        <TotalRow
                          label="Total Expenses"
                          value={plData.expenses?.total ?? 0}
                          color="text-red-600"
                          border
                          format={format}
                        />
                      </TableBody>
                    </Table>
                  </div>

                  {/* Net Income */}
                  <div className="pt-2 border-t-2">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-lg font-bold">
                            Net Income
                          </TableCell>
                          <TableCell
                            className={`text-right text-lg font-bold ${(plData.summary?.netIncome ?? 0) >= 0 ? "text-blue-600" : "text-red-600"}`}
                          >
                            {(plData.summary?.netIncome ?? 0) < 0
                              ? `(${format(Math.abs(plData.summary.netIncome))})`
                              : format(plData.summary?.netIncome ?? 0)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Balance Sheet ── */}
        <TabsContent value="balance-sheet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>As of {endDate}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || !bsData ? (
                <ReportSkeleton />
              ) : (
                <div className="space-y-6">
                  {/* Assets */}
                  <div>
                    <h3 className="text-base font-semibold mb-3">Assets</h3>
                    <Table>
                      <TableBody>
                        {(bsData.assets?.currentAssets ?? []).length > 0 && (
                          <>
                            <TableRow>
                              <TableCell className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                                Current Assets
                              </TableCell>
                              <TableCell />
                            </TableRow>
                            <SectionRows
                              items={bsData.assets.currentAssets}
                              valueKey="balance"
                              format={format}
                            />
                          </>
                        )}
                        {(bsData.assets?.fixedAssets ?? []).length > 0 && (
                          <>
                            <TableRow>
                              <TableCell className="font-medium text-muted-foreground text-xs uppercase tracking-wide pt-4">
                                Fixed Assets
                              </TableCell>
                              <TableCell />
                            </TableRow>
                            <SectionRows
                              items={bsData.assets.fixedAssets}
                              valueKey="balance"
                              format={format}
                            />
                          </>
                        )}
                        {(bsData.assets?.otherAssets ?? []).length > 0 && (
                          <>
                            <TableRow>
                              <TableCell className="font-medium text-muted-foreground text-xs uppercase tracking-wide pt-4">
                                Other Assets
                              </TableCell>
                              <TableCell />
                            </TableRow>
                            <SectionRows
                              items={bsData.assets.otherAssets}
                              valueKey="balance"
                              format={format}
                            />
                          </>
                        )}
                        <TotalRow
                          label="Total Assets"
                          value={bsData.assets?.total ?? 0}
                          color="text-blue-600"
                          border
                          format={format}
                        />
                      </TableBody>
                    </Table>
                  </div>

                  {/* Liabilities */}
                  <div>
                    <h3 className="text-base font-semibold mb-3">
                      Liabilities
                    </h3>
                    <Table>
                      <TableBody>
                        {(bsData.liabilities?.currentLiabilities ?? []).length >
                          0 && (
                          <>
                            <TableRow>
                              <TableCell className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                                Current Liabilities
                              </TableCell>
                              <TableCell />
                            </TableRow>
                            <SectionRows
                              items={bsData.liabilities.currentLiabilities}
                              valueKey="balance"
                              format={format}
                            />
                          </>
                        )}
                        {(bsData.liabilities?.longTermLiabilities ?? [])
                          .length > 0 && (
                          <>
                            <TableRow>
                              <TableCell className="font-medium text-muted-foreground text-xs uppercase tracking-wide pt-4">
                                Long-Term Liabilities
                              </TableCell>
                              <TableCell />
                            </TableRow>
                            <SectionRows
                              items={bsData.liabilities.longTermLiabilities}
                              valueKey="balance"
                              format={format}
                            />
                          </>
                        )}
                        <TotalRow
                          label="Total Liabilities"
                          value={bsData.liabilities?.total ?? 0}
                          color="text-red-600"
                          border
                          format={format}
                        />
                      </TableBody>
                    </Table>
                  </div>

                  {/* Equity */}
                  <div>
                    <h3 className="text-base font-semibold mb-3">Equity</h3>
                    <Table>
                      <TableBody>
                        <SectionRows
                          items={bsData.equity?.accounts ?? []}
                          valueKey="balance"
                          format={format}
                        />
                        {(bsData.equity?.currentYearNetIncome ?? 0) !== 0 && (
                          <TableRow>
                            <TableCell className="pl-8 text-sm">
                              Current Year Net Income
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {format(bsData.equity?.currentYearNetIncome ?? 0)}
                            </TableCell>
                          </TableRow>
                        )}
                        <TotalRow
                          label="Total Equity"
                          value={bsData.equity?.total ?? 0}
                          color="text-green-600"
                          border
                          format={format}
                        />
                      </TableBody>
                    </Table>
                  </div>

                  {/* Equation check */}
                  <div className="pt-2 border-t-2">
                    <Table>
                      <TableBody>
                        <TotalRow
                          label="Total Liabilities & Equity"
                          value={
                            (bsData.liabilities?.total ?? 0) +
                            (bsData.equity?.total ?? 0)
                          }
                          color="text-blue-600"
                          format={format}
                        />
                      </TableBody>
                    </Table>
                    {!bsData.balanced && (
                      <p className="mt-2 text-xs text-yellow-600">
                        ⚠ Balance sheet difference:{" "}
                        {format(Math.abs(bsData.equation?.difference ?? 0))} —
                        check for unposted entries or missing accounts.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Cash Flow ── */}
        <TabsContent value="cash-flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
              <CardDescription>
                Jan 1 – {endDate} {year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || !cfData ? (
                <ReportSkeleton />
              ) : (
                <div className="space-y-6">
                  {/* Operating */}
                  <div>
                    <h3 className="text-base font-semibold mb-3">
                      Operating Activities
                    </h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="pl-8 text-sm">
                            Net Income
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {format(cfData.operatingActivities?.netIncome ?? 0)}
                          </TableCell>
                        </TableRow>
                        {(cfData.operatingActivities
                          ?.depreciationAmortization ?? 0) > 0 && (
                          <TableRow>
                            <TableCell className="pl-8 text-sm">
                              Add: Depreciation &amp; Amortization
                            </TableCell>
                            <TableCell className="text-right text-sm text-green-600">
                              {format(
                                cfData.operatingActivities
                                  .depreciationAmortization,
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                        {(cfData.operatingActivities?.adjustments ?? []).map(
                          (adj: AccountLineItem, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="pl-8 text-sm">
                                {adj.accountName}
                              </TableCell>
                              <TableCell
                                className={`text-right text-sm ${(adj.cashEffect ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {(adj.cashEffect ?? 0) < 0
                                  ? `(${format(Math.abs(adj.cashEffect ?? 0))})`
                                  : format(adj.cashEffect ?? 0)}
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                        <TotalRow
                          label="Net Cash from Operations"
                          value={cfData.operatingActivities?.total ?? 0}
                          color="text-green-600"
                          border
                          format={format}
                        />
                      </TableBody>
                    </Table>
                  </div>

                  {/* Investing */}
                  <div>
                    <h3 className="text-base font-semibold mb-3">
                      Investing Activities
                    </h3>
                    <Table>
                      <TableBody>
                        {(cfData.investingActivities?.items ?? []).length ===
                        0 ? (
                          <TableRow>
                            <TableCell
                              className="pl-8 text-sm text-muted-foreground"
                              colSpan={2}
                            >
                              No investing activities
                            </TableCell>
                          </TableRow>
                        ) : (
                          <SectionRows
                            items={cfData.investingActivities.items}
                            valueKey="netCashEffect"
                            format={format}
                          />
                        )}
                        <TotalRow
                          label="Net Cash from Investing"
                          value={cfData.investingActivities?.total ?? 0}
                          border
                          format={format}
                        />
                      </TableBody>
                    </Table>
                  </div>

                  {/* Financing */}
                  <div>
                    <h3 className="text-base font-semibold mb-3">
                      Financing Activities
                    </h3>
                    <Table>
                      <TableBody>
                        {(cfData.financingActivities?.items ?? []).length ===
                        0 ? (
                          <TableRow>
                            <TableCell
                              className="pl-8 text-sm text-muted-foreground"
                              colSpan={2}
                            >
                              No financing activities
                            </TableCell>
                          </TableRow>
                        ) : (
                          <SectionRows
                            items={cfData.financingActivities.items}
                            valueKey="netCashEffect"
                            format={format}
                          />
                        )}
                        <TotalRow
                          label="Net Cash from Financing"
                          value={cfData.financingActivities?.total ?? 0}
                          border
                          format={format}
                        />
                      </TableBody>
                    </Table>
                  </div>

                  {/* Summary */}
                  <div className="pt-2 border-t-2">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">
                            Beginning Cash Balance
                          </TableCell>
                          <TableCell className="text-right">
                            {format(cfData.beginningCash ?? 0)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Net Change in Cash
                          </TableCell>
                          <TableCell
                            className={`text-right ${(cfData.netCashFlow ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {(cfData.netCashFlow ?? 0) < 0
                              ? `(${format(Math.abs(cfData.netCashFlow))})`
                              : format(cfData.netCashFlow ?? 0)}
                          </TableCell>
                        </TableRow>
                        <TotalRow
                          label="Ending Cash Balance"
                          value={cfData.endingCash ?? 0}
                          color="text-blue-600"
                          border
                          format={format}
                        />
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
