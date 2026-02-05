"use client";

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
import { Download, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";

export default function CashFlowPage() {
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
              {formatCurrency(167500)}
            </div>
            <Progress value={75} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              75% of total activity
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
              {formatCurrency(55250)}
            </div>
            <Progress value={25} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              25% of total activity
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(112250)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Positive cash flow
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(85200)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              As of Nov 20, 2025
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Statement - Year 2025</CardTitle>
          <CardDescription>
            Detailed breakdown of cash movements across operating, investing,
            and financing activities
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
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(75100)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="pt-4 pb-2 text-sm font-semibold"
                      >
                        Adjustments to reconcile net income:
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell className="pl-8">
                        Depreciation and Amortization
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(20000)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell className="pl-8">
                        Decrease in Accounts Receivable
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(8500)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell className="pl-8">
                        Increase in Inventory
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        ({formatCurrency(5200)})
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell className="pl-8">
                        Increase in Prepaid Expenses
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        ({formatCurrency(2000)})
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell className="pl-8">
                        Increase in Accounts Payable
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(4500)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell className="pl-8">
                        Increase in Accrued Expenses
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(3150)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell className="pl-8">
                        Increase in Unearned Revenue
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(7500)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-t-2 bg-blue-50 dark:bg-blue-950/20">
                      <TableCell className="font-bold">
                        Net Cash Provided by Operating Activities
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        {formatCurrency(111550)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Investing Activities */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-bold mb-4 text-purple-600">
                CASH FLOWS FROM INVESTING ACTIVITIES
              </h3>
              <div className="ml-4">
                <Table>
                  <TableBody>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>Purchase of Property and Equipment</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        ({formatCurrency(25000)})
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>Purchase of Furniture and Fixtures</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        ({formatCurrency(8000)})
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>Investment in Intangible Assets</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        ({formatCurrency(10000)})
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>Proceeds from Sale of Equipment</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(5000)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-t-2 bg-purple-50 dark:bg-purple-950/20">
                      <TableCell className="font-bold">
                        Net Cash Used in Investing Activities
                      </TableCell>
                      <TableCell className="text-right font-bold text-purple-600">
                        ({formatCurrency(38000)})
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Financing Activities */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-bold mb-4 text-orange-600">
                CASH FLOWS FROM FINANCING ACTIVITIES
              </h3>
              <div className="ml-4">
                <Table>
                  <TableBody>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>Proceeds from Long-term Debt</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(40000)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>Repayment of Short-term Debt</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        ({formatCurrency(10000)})
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>Owner Contributions</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(25000)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>Owner Draws</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        ({formatCurrency(16300)})
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-t-2 bg-orange-50 dark:bg-orange-950/20">
                      <TableCell className="font-bold">
                        Net Cash Provided by Financing Activities
                      </TableCell>
                      <TableCell className="text-right font-bold text-orange-600">
                        {formatCurrency(38700)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Net Change in Cash */}
            <div className="pt-8 border-t-4">
              <Table>
                <TableBody>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell className="font-semibold">
                      Net Increase in Cash and Cash Equivalents
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {formatCurrency(112250)}.00
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell>
                      Cash and Cash Equivalents at Beginning of Period
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ({formatCurrency(27050)})
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-t-2 bg-primary/10">
                    <TableCell className="text-lg font-bold">
                      Cash and Cash Equivalents at End of Period
                    </TableCell>
                    <TableCell className="text-right text-lg font-bold text-primary">
                      {formatCurrency(85200)}.00
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Supplemental Disclosures */}
            <div className="pt-6 border-t">
              <h4 className="text-sm font-semibold mb-3">
                SUPPLEMENTAL DISCLOSURES
              </h4>
              <div className="ml-4 text-sm space-y-2">
                <Table>
                  <TableBody>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>Cash Paid for Interest</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(3200)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>Cash Paid for Income Taxes</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(18750)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Operating Cash Flow Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">3.11</div>
            <p className="text-xs text-muted-foreground mt-1">
              Operating Cash Flow / Current Liabilities
            </p>
            <p className="text-xs text-green-600 mt-1">
              ✓ Strong ability to cover short-term obligations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Free Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(73550)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Operating Cash Flow - Capital Expenditures
            </p>
            <p className="text-xs text-blue-600 mt-1">
              ✓ Available for growth and dividends
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Cash Conversion Cycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32 days</div>
            <p className="text-xs text-muted-foreground mt-1">
              Time to convert investments back to cash
            </p>
            <p className="text-xs text-green-600 mt-1">
              ✓ Efficient working capital management
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
