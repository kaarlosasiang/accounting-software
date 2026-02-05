"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
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
          <Select defaultValue="2025">
            <SelectTrigger className="w-[120px]">
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
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profit-loss" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
          <TabsTrigger value="tax-summary">Tax Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>
                Income and expenses for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Revenue</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          Services Rendered (Salon/Spa)
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          {formatCurrency(38250)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Food Sales
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          {formatCurrency(25500)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Non-Food Sales
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          {formatCurrency(17000)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Other Income
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          {formatCurrency(4250)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-t-2">
                        <TableCell className="font-bold">
                          Total Revenue
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {formatCurrency(85000)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Expenses</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          Cost of Goods Sold (Food)
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(15300)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Cost of Goods Sold (Non-Food)
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(8500)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Salon/Spa Supplies
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(5250)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Rent & Utilities
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(8000)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Salaries & Wages
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(12000)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Marketing & Advertising
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(2450)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-t-2">
                        <TableCell className="font-bold">
                          Total Expenses
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          {formatCurrency(51500)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="pt-4 border-t-2">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-lg font-bold">
                          Net Income
                        </TableCell>
                        <TableCell className="text-right text-lg font-bold text-blue-600">
                          {formatCurrency(33500)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>
                Assets, liabilities, and equity overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Assets</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          Current Assets
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(125450)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-8">
                          Cash and Cash Equivalents
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(85200)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-8">
                          Accounts Receivable
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(35250)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-8">Prepaid Expenses</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(5000)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium pt-4">
                          Fixed Assets
                        </TableCell>
                        <TableCell className="text-right font-semibold pt-4">
                          {formatCurrency(45000)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-8">Equipment</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(25000)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-8">
                          Furniture & Fixtures
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(20000)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-t-2">
                        <TableCell className="font-bold">
                          Total Assets
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-600">
                          {formatCurrency(170450)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Liabilities</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          Current Liabilities
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(28350)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-8">Accounts Payable</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(15200)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-8">Accrued Expenses</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(8150)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-8">Short-term Debt</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(5000)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-t-2">
                        <TableCell className="font-bold">
                          Total Liabilities
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          {formatCurrency(28350)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Equity</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          Owner&apos;s Equity
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(67000)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Retained Earnings
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(75100)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-t-2">
                        <TableCell className="font-bold">
                          Total Equity
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {formatCurrency(142100)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="pt-4 border-t-2">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-lg font-bold">
                          Total Liabilities & Equity
                        </TableCell>
                        <TableCell className="text-right text-lg font-bold text-blue-600">
                          {formatCurrency(170450)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
              <CardDescription>
                Cash inflows and outflows for the period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Operating Activities
                  </h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          Cash from Customers
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(82500)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Cash to Suppliers
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          ({formatCurrency(10250)})
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Cash to Employees
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          ({formatCurrency(0)})
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-t">
                        <TableCell className="font-bold">
                          Net Cash from Operations
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {formatCurrency(72250)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Investing Activities
                  </h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          Purchase of Equipment
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          ({formatCurrency(5000)})
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-t">
                        <TableCell className="font-bold">
                          Net Cash from Investing
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          ({formatCurrency(5000)})
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Financing Activities
                  </h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          Owner Contributions
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(0)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Owner Draws
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          ({formatCurrency(10000)})
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-t">
                        <TableCell className="font-bold">
                          Net Cash from Financing
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          ({formatCurrency(10000)})
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="pt-4 border-t-2">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          Beginning Cash Balance
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(27950)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Net Change in Cash
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(57250)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-t-2">
                        <TableCell className="text-lg font-bold">
                          Ending Cash Balance
                        </TableCell>
                        <TableCell className="text-right text-lg font-bold text-blue-600">
                          {formatCurrency(85200)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax-summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Summary</CardTitle>
              <CardDescription>
                Tax obligations and deductions for the period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Income Summary</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          Gross Revenue
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(88700)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Total Deductible Expenses
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          ({formatCurrency(13599)})
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-t-2">
                        <TableCell className="font-bold">
                          Net Taxable Income
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(75101)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Tax Estimates</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          Federal Income Tax (Est. 22%)
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {formatCurrency(16522.22)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          State Income Tax (Est. 5%)
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {formatCurrency(3755.05)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Self-Employment Tax (Est. 15.3%)
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {formatCurrency(11490.45)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-t-2">
                        <TableCell className="font-bold">
                          Total Estimated Tax
                        </TableCell>
                        <TableCell className="text-right font-bold text-orange-600">
                          {formatCurrency(31767.72)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="pt-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> These are estimated tax
                      calculations. Please consult with a tax professional for
                      accurate tax planning and filing.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
