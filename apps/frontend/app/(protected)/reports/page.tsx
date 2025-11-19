"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table"
import {
    Download,
} from "lucide-react"

export default function ReportsPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
                    <p className="text-muted-foreground">
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
                                                <TableCell className="font-medium">Professional Services</TableCell>
                                                <TableCell className="text-right text-green-600 font-semibold">$45,000.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">Consulting Revenue</TableCell>
                                                <TableCell className="text-right text-green-600 font-semibold">$28,500.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">Recurring Revenue</TableCell>
                                                <TableCell className="text-right text-green-600 font-semibold">$15,200.00</TableCell>
                                            </TableRow>
                                            <TableRow className="border-t-2">
                                                <TableCell className="font-bold">Total Revenue</TableCell>
                                                <TableCell className="text-right font-bold text-green-600">$88,700.00</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Expenses</h3>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-medium">Office Expenses</TableCell>
                                                <TableCell className="text-right text-red-600">$3,450.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">Software & Tools</TableCell>
                                                <TableCell className="text-right text-red-600">$1,299.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">Professional Services</TableCell>
                                                <TableCell className="text-right text-red-600">$2,800.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">Marketing & Advertising</TableCell>
                                                <TableCell className="text-right text-red-600">$4,200.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">Travel & Entertainment</TableCell>
                                                <TableCell className="text-right text-red-600">$1,850.00</TableCell>
                                            </TableRow>
                                            <TableRow className="border-t-2">
                                                <TableCell className="font-bold">Total Expenses</TableCell>
                                                <TableCell className="text-right font-bold text-red-600">$13,599.00</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="pt-4 border-t-2">
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="text-lg font-bold">Net Income</TableCell>
                                                <TableCell className="text-right text-lg font-bold text-blue-600">$75,101.00</TableCell>
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
                                                <TableCell className="font-medium">Current Assets</TableCell>
                                                <TableCell className="text-right font-semibold">$125,450.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="pl-8">Cash and Cash Equivalents</TableCell>
                                                <TableCell className="text-right">$85,200.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="pl-8">Accounts Receivable</TableCell>
                                                <TableCell className="text-right">$35,250.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="pl-8">Prepaid Expenses</TableCell>
                                                <TableCell className="text-right">$5,000.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium pt-4">Fixed Assets</TableCell>
                                                <TableCell className="text-right font-semibold pt-4">$45,000.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="pl-8">Equipment</TableCell>
                                                <TableCell className="text-right">$25,000.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="pl-8">Furniture & Fixtures</TableCell>
                                                <TableCell className="text-right">$20,000.00</TableCell>
                                            </TableRow>
                                            <TableRow className="border-t-2">
                                                <TableCell className="font-bold">Total Assets</TableCell>
                                                <TableCell className="text-right font-bold text-blue-600">$170,450.00</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Liabilities</h3>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-medium">Current Liabilities</TableCell>
                                                <TableCell className="text-right font-semibold">$28,350.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="pl-8">Accounts Payable</TableCell>
                                                <TableCell className="text-right">$15,200.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="pl-8">Accrued Expenses</TableCell>
                                                <TableCell className="text-right">$8,150.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="pl-8">Short-term Debt</TableCell>
                                                <TableCell className="text-right">$5,000.00</TableCell>
                                            </TableRow>
                                            <TableRow className="border-t-2">
                                                <TableCell className="font-bold">Total Liabilities</TableCell>
                                                <TableCell className="text-right font-bold text-red-600">$28,350.00</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Equity</h3>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-medium">Owner&apos;s Equity</TableCell>
                                                <TableCell className="text-right">$67,000.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">Retained Earnings</TableCell>
                                                <TableCell className="text-right">$75,100.00</TableCell>
                                            </TableRow>
                                            <TableRow className="border-t-2">
                                                <TableCell className="font-bold">Total Equity</TableCell>
                                                <TableCell className="text-right font-bold text-green-600">$142,100.00</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="pt-4 border-t-2">
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="text-lg font-bold">Total Liabilities & Equity</TableCell>
                                                <TableCell className="text-right text-lg font-bold text-blue-600">$170,450.00</TableCell>
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
                                    <h3 className="text-lg font-semibold mb-4">Operating Activities</h3>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-medium">Cash from Customers</TableCell>
                                                <TableCell className="text-right text-green-600">$82,500.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">Cash to Suppliers</TableCell>
                                                <TableCell className="text-right text-red-600">($10,250.00)</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">Cash to Employees</TableCell>
                                                <TableCell className="text-right text-red-600">($0.00)</TableCell>
                                            </TableRow>
                                            <TableRow className="border-t">
                                                <TableCell className="font-bold">Net Cash from Operations</TableCell>
                                                <TableCell className="text-right font-bold text-green-600">$72,250.00</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Investing Activities</h3>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-medium">Purchase of Equipment</TableCell>
                                                <TableCell className="text-right text-red-600">($5,000.00)</TableCell>
                                            </TableRow>
                                            <TableRow className="border-t">
                                                <TableCell className="font-bold">Net Cash from Investing</TableCell>
                                                <TableCell className="text-right font-bold text-red-600">($5,000.00)</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Financing Activities</h3>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-medium">Owner Contributions</TableCell>
                                                <TableCell className="text-right text-green-600">$0.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">Owner Draws</TableCell>
                                                <TableCell className="text-right text-red-600">($10,000.00)</TableCell>
                                            </TableRow>
                                            <TableRow className="border-t">
                                                <TableCell className="font-bold">Net Cash from Financing</TableCell>
                                                <TableCell className="text-right font-bold text-red-600">($10,000.00)</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="pt-4 border-t-2">
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-medium">Beginning Cash Balance</TableCell>
                                                <TableCell className="text-right">$27,950.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">Net Change in Cash</TableCell>
                                                <TableCell className="text-right text-green-600">$57,250.00</TableCell>
                                            </TableRow>
                                            <TableRow className="border-t-2">
                                                <TableCell className="text-lg font-bold">Ending Cash Balance</TableCell>
                                                <TableCell className="text-right text-lg font-bold text-blue-600">$85,200.00</TableCell>
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
                                                <TableCell className="font-medium">Gross Revenue</TableCell>
                                                <TableCell className="text-right">$88,700.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">Total Deductible Expenses</TableCell>
                                                <TableCell className="text-right text-red-600">($13,599.00)</TableCell>
                                            </TableRow>
                                            <TableRow className="border-t-2">
                                                <TableCell className="font-bold">Net Taxable Income</TableCell>
                                                <TableCell className="text-right font-bold">$75,101.00</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Tax Estimates</h3>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-medium">Federal Income Tax (Est. 22%)</TableCell>
                                                <TableCell className="text-right text-orange-600">$16,522.22</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">State Income Tax (Est. 5%)</TableCell>
                                                <TableCell className="text-right text-orange-600">$3,755.05</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">Self-Employment Tax (Est. 15.3%)</TableCell>
                                                <TableCell className="text-right text-orange-600">$11,490.45</TableCell>
                                            </TableRow>
                                            <TableRow className="border-t-2">
                                                <TableCell className="font-bold">Total Estimated Tax</TableCell>
                                                <TableCell className="text-right font-bold text-orange-600">$31,767.72</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="pt-4">
                                    <div className="bg-muted p-4 rounded-lg">
                                        <p className="text-sm text-muted-foreground">
                                            <strong>Note:</strong> These are estimated tax calculations. Please consult with a tax professional for accurate tax planning and filing.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

