"use client";

import { AlertCircle, Calendar, Download, FileText } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReports } from "@/hooks/use-reports";
import { formatCurrency } from "@/lib/utils";
import { downloadCsv } from "@/lib/utils/csv-export";

// BIR graduated income tax (Philippines, TRAIN Law)
function computeBIRIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  if (taxableIncome <= 250000) return 0;
  if (taxableIncome <= 400000) return (taxableIncome - 250000) * 0.2;
  if (taxableIncome <= 800000) return 30000 + (taxableIncome - 400000) * 0.25;
  if (taxableIncome <= 2000000) return 130000 + (taxableIncome - 800000) * 0.3;
  if (taxableIncome <= 8000000)
    return 490000 + (taxableIncome - 2000000) * 0.32;
  return 2410000 + (taxableIncome - 8000000) * 0.35;
}

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear - 1, currentYear - 2, currentYear - 3].map(
  String,
);

export default function TaxSummaryPage() {
  const { fetchIncomeStatement, isLoading } = useReports();
  const [selectedYear, setSelectedYear] = useState(String(currentYear - 1));
  const [incomeData, setIncomeData] = useState<any>(null);

  const loadData = useCallback(
    async (year: string) => {
      const data = await fetchIncomeStatement(`${year}-01-01`, `${year}-12-31`);
      setIncomeData(data);
    },
    [fetchIncomeStatement],
  );

  useEffect(() => {
    loadData(selectedYear);
  }, [selectedYear, loadData]);

  const grossRevenue: number = incomeData?.summary?.totalRevenue ?? 0;
  const totalDeductions: number = incomeData?.summary?.totalExpenses ?? 0;
  const netTaxableIncome: number = incomeData?.summary?.netIncome ?? 0;
  const incomeTax = computeBIRIncomeTax(netTaxableIncome);
  const percentageTax = grossRevenue * 0.03;
  const totalTaxLiability = incomeTax + percentageTax;
  const quarterlyPayment = totalTaxLiability / 4;

  const revenueAccounts: Array<{ accountName: string; balance: number }> =
    incomeData?.revenue?.operatingRevenue ?? [];
  const costOfSales: Array<{ accountName: string; balance: number }> =
    incomeData?.expenses?.costOfSales ?? [];
  const opExpenses: Array<{ accountName: string; balance: number }> =
    incomeData?.expenses?.operatingExpenses ?? [];
  const allDeductions = [...costOfSales, ...opExpenses];

  const q4DueDate = `January 25, ${Number(selectedYear) + 1}`;
  const today = new Date();

  function quarterStatus(dueStr: string) {
    return new Date(dueStr) < today ? "Paid" : "Due Soon";
  }

  const quarterRows = [
    { label: `Q1 ${selectedYear}`, due: `May 15, ${selectedYear}` },
    { label: `Q2 ${selectedYear}`, due: `August 15, ${selectedYear}` },
    { label: `Q3 ${selectedYear}`, due: `November 15, ${selectedYear}` },
    { label: `Q4 ${selectedYear}`, due: q4DueDate },
  ];

  const handleExport = () => {
    if (!incomeData) return;
    const rows = [
      {
        Section: "INCOME SUMMARY",
        Item: "Gross Revenue",
        Amount: grossRevenue,
      },
      {
        Section: "INCOME SUMMARY",
        Item: "Total Deductions",
        Amount: totalDeductions,
      },
      {
        Section: "INCOME SUMMARY",
        Item: "Net Taxable Income",
        Amount: netTaxableIncome,
      },
      { Section: "TAX ESTIMATES", Item: "BIR Income Tax", Amount: incomeTax },
      {
        Section: "TAX ESTIMATES",
        Item: "Percentage Tax (3%)",
        Amount: percentageTax,
      },
      {
        Section: "TAX ESTIMATES",
        Item: "Total Estimated Tax",
        Amount: totalTaxLiability,
      },
    ];
    downloadCsv(`tax-summary-${selectedYear}.csv`, rows);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Tax Summary
          </h1>
          <p className="text-muted-foreground text-sm">
            Tax obligations, deductions, and estimated payments for the period
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!incomeData || isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export to Accountant
          </Button>
        </div>
      </div>

      {!isLoading && totalTaxLiability > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>BIR Tax Filing Reminder</AlertTitle>
          <AlertDescription>
            Q4 {selectedYear} quarterly tax return is due on {q4DueDate}. Your
            estimated payment is {formatCurrency(quarterlyPayment)}.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-3/4" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Gross Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(grossRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total income for {selectedYear}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Deductions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalDeductions)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tax-deductible expenses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Taxable Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(netTaxableIncome)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  After deductions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Est. Tax Liability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(totalTaxLiability)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  BIR income + percentage tax
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      {/* Income Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Income Summary — Tax Year {selectedYear}</CardTitle>
          <CardDescription>
            Breakdown of taxable and deductible amounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Gross Income</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : revenueAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        No revenue data
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {revenueAccounts.map((acct, i) => (
                        <TableRow key={i}>
                          <TableCell>{acct.accountName}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(acct.balance)}
                          </TableCell>
                          <TableCell className="text-right">
                            {grossRevenue > 0
                              ? ((acct.balance / grossRevenue) * 100).toFixed(1)
                              : "0.0"}
                            %
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 bg-muted/30">
                        <TableCell className="font-bold">
                          Total Gross Income
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(grossRevenue)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          100%
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4">Tax Deductions</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expense Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Deductible %</TableHead>
                    <TableHead className="text-right">Tax Benefit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : allDeductions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        No expense data
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {allDeductions.map((acct, i) => (
                        <TableRow key={i}>
                          <TableCell>{acct.accountName}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(acct.balance)}
                          </TableCell>
                          <TableCell className="text-right">100%</TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(acct.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 bg-green-50 dark:bg-green-950/20">
                        <TableCell className="font-bold">
                          Total Deductions
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(totalDeductions)}
                        </TableCell>
                        <TableCell className="text-right" />
                        <TableCell className="text-right font-bold text-green-600">
                          {formatCurrency(totalDeductions)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="pt-4 border-t">
              <Table>
                <TableBody>
                  <TableRow className="bg-primary/5">
                    <TableCell className="text-lg font-bold">
                      Net Taxable Income
                    </TableCell>
                    <TableCell className="text-right text-lg font-bold text-primary">
                      {formatCurrency(netTaxableIncome)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Calculations */}
      <Card>
        <CardHeader>
          <CardTitle>Estimated Tax Liability (BIR)</CardTitle>
          <CardDescription>
            Breakdown of income tax and business tax obligations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-semibold">
                    Income Tax (Graduated Rates)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Per BIR TRAIN Law tax table
                  </p>
                  <Progress
                    value={
                      totalTaxLiability > 0
                        ? (incomeTax / totalTaxLiability) * 100
                        : 0
                    }
                    className="mt-2 w-64"
                  />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(incomeTax)}
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {totalTaxLiability > 0
                      ? Math.round((incomeTax / totalTaxLiability) * 100)
                      : 0}
                    % of total
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-semibold">Percentage Tax (Non-VAT)</h4>
                  <p className="text-sm text-muted-foreground">
                    3% of gross sales/receipts
                  </p>
                  <Progress
                    value={
                      totalTaxLiability > 0
                        ? (percentageTax / totalTaxLiability) * 100
                        : 0
                    }
                    className="mt-2 w-64"
                  />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(percentageTax)}
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {totalTaxLiability > 0
                      ? Math.round((percentageTax / totalTaxLiability) * 100)
                      : 0}
                    % of total
                  </Badge>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2">
              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div>
                  <h3 className="text-xl font-bold">
                    Total Estimated Tax Liability
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    For tax year {selectedYear}
                  </p>
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {formatCurrency(totalTaxLiability)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Quarterly Income Tax Returns (BIR Form 1701Q)</CardTitle>
          <CardDescription>
            Schedule and track your quarterly tax filings with BIR
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quarter</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quarterRows.map((q) => {
                const status = quarterStatus(q.due);
                return (
                  <TableRow key={q.label}>
                    <TableCell className="font-medium">{q.label}</TableCell>
                    <TableCell>{q.due}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(quarterlyPayment)}
                    </TableCell>
                    <TableCell className="text-right">
                      {status === "Paid" ? (
                        <Badge variant="default" className="bg-green-600">
                          Paid
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600">
                          Due Soon
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="border-t-2 bg-muted/30">
                <TableCell colSpan={2} className="font-bold">
                  Total Annual Payment
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(totalTaxLiability)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tax Documents */}
      <Card>
        <CardHeader>
          <CardTitle>BIR Tax Documents & Forms</CardTitle>
          <CardDescription>
            Download and manage your BIR tax-related documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                name: "BIR Form 1701Q - Quarterly Income Tax Return",
                form: "1701Q",
                status: "Draft",
              },
              {
                name: "BIR Form 2551Q - Quarterly Percentage Tax",
                form: "2551Q",
                status: "Ready",
              },
              {
                name: "BIR Form 0605 - Payment Form",
                form: "0605",
                status: "Completed",
              },
              {
                name: "Annual Income Tax Return (1701)",
                form: "1701",
                status: "Pending",
              },
            ].map((doc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Form {doc.form}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={doc.status === "Completed" ? "default" : "outline"}
                >
                  {doc.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
