"use client";

import { useEffect, useState } from "react";
import { useReports } from "@/hooks/use-reports";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Calendar, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export default function APAgingReportPage() {
  const { apAgingReport, isLoading, fetchAPAgingReport } = useReports();
  const [asOfDate, setAsOfDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    fetchAPAgingReport(asOfDate);
  }, [asOfDate, fetchAPAgingReport]);

  const handleExport = () => {
    // TODO: Implement CSV/PDF export
    alert("Export functionality coming soon!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Loading AP Aging Report...
          </p>
        </div>
      </div>
    );
  }

  if (!apAgingReport) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Accounts Payable Aging Report
          </h1>
          <p className="text-muted-foreground">
            Outstanding supplier bills grouped by age
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Report Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="asOfDate">As of Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="asOfDate"
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Outstanding
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(apAgingReport.summary.totalOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground">
              {apAgingReport.summary.totalSuppliers} suppliers,{" "}
              {apAgingReport.summary.totalBills} bills
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(apAgingReport.grandTotals.current)}
            </div>
            <p className="text-xs text-muted-foreground">Not yet overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">90+ Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(apAgingReport.grandTotals.days90plus)}
            </div>
            <p className="text-xs text-muted-foreground">
              Significantly overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aging Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aging Details</CardTitle>
          <CardDescription>
            As of {format(new Date(asOfDate), "MMMM dd, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">1-30 Days</TableHead>
                  <TableHead className="text-right">31-60 Days</TableHead>
                  <TableHead className="text-right">61-90 Days</TableHead>
                  <TableHead className="text-right">90+ Days</TableHead>
                  <TableHead className="text-right font-semibold">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apAgingReport.suppliers.map((supplier) => (
                  <TableRow key={supplier.supplierId}>
                    <TableCell className="font-medium">
                      {supplier.supplierName}
                      <div className="text-xs text-muted-foreground">
                        {supplier.bills.length} bill(s)
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(supplier.totals.current)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(supplier.totals.days1to30)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(supplier.totals.days31to60)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(supplier.totals.days61to90)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {formatCurrency(supplier.totals.days90plus)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(supplier.totals.total)}
                    </TableCell>
                  </TableRow>
                ))}
                {apAgingReport.suppliers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      No outstanding bills
                    </TableCell>
                  </TableRow>
                )}
                {/* Grand Totals Row */}
                {apAgingReport.suppliers.length > 0 && (
                  <TableRow className="border-t-2 bg-muted/50 font-semibold">
                    <TableCell>Grand Total</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(apAgingReport.grandTotals.current)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(apAgingReport.grandTotals.days1to30)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(apAgingReport.grandTotals.days31to60)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(apAgingReport.grandTotals.days61to90)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {formatCurrency(apAgingReport.grandTotals.days90plus)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(apAgingReport.grandTotals.total)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
