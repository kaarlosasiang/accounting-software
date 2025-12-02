"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Download, Calendar, AlertCircle, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"

export default function TaxSummaryPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Tax Summary</h1>
                    <p className="text-muted-foreground mt-2">
                        Tax obligations, deductions, and estimated payments for the period
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
                        Export to Accountant
                    </Button>
                </div>
            </div>

            {/* Alert Banner */}
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>BIR Tax Filing Reminder</AlertTitle>
                <AlertDescription>
                    Q4 2025 quarterly tax return is due on January 25, 2026. Your estimated payment is {formatCurrency(2094)}.
                </AlertDescription>
            </Alert>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(85000)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total income for 2025</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Deductions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(51500)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Tax-deductible expenses</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Taxable Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(33500)}</div>
                        <p className="text-xs text-muted-foreground mt-1">After deductions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Est. Tax Liability</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(8375)}</div>
                        <p className="text-xs text-muted-foreground mt-1">BIR graduated income tax (≈25%)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Income Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Income Summary - Tax Year 2025</CardTitle>
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
                                    <TableRow>
                                        <TableCell>Services Rendered (Salon/Spa)</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(38250)}</TableCell>
                                        <TableCell className="text-right">45.0%</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Food Sales</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(25500)}</TableCell>
                                        <TableCell className="text-right">30.0%</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Non-Food Sales</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(17000)}</TableCell>
                                        <TableCell className="text-right">20.0%</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Other Income</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(4250)}</TableCell>
                                        <TableCell className="text-right">5.0%</TableCell>
                                    </TableRow>
                                    <TableRow className="border-t-2 bg-muted/30">
                                        <TableCell className="font-bold">Total Gross Income</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(85000)}</TableCell>
                                        <TableCell className="text-right font-bold">100%</TableCell>
                                    </TableRow>
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
                                    <TableRow>
                                        <TableCell>Cost of Goods Sold (Food)</TableCell>
                                        <TableCell className="text-right">{formatCurrency(15300)}</TableCell>
                                        <TableCell className="text-right">100%</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(15300)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Cost of Goods Sold (Non-Food)</TableCell>
                                        <TableCell className="text-right">{formatCurrency(8500)}</TableCell>
                                        <TableCell className="text-right">100%</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(8500)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Salon/Spa Supplies</TableCell>
                                        <TableCell className="text-right">{formatCurrency(5250)}</TableCell>
                                        <TableCell className="text-right">100%</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(5250)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Rent & Utilities</TableCell>
                                        <TableCell className="text-right">{formatCurrency(8000)}</TableCell>
                                        <TableCell className="text-right">100%</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(8000)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Salaries & Wages</TableCell>
                                        <TableCell className="text-right">{formatCurrency(12000)}</TableCell>
                                        <TableCell className="text-right">100%</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(12000)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Marketing & Advertising</TableCell>
                                        <TableCell className="text-right">{formatCurrency(2450)}</TableCell>
                                        <TableCell className="text-right">100%</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(2450)}</TableCell>
                                    </TableRow>
                                    <TableRow className="border-t-2 bg-green-50 dark:bg-green-950/20">
                                        <TableCell className="font-bold">Total Deductions</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(51500)}</TableCell>
                                        <TableCell className="text-right"></TableCell>
                                        <TableCell className="text-right font-bold text-green-600">{formatCurrency(51500)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        <div className="pt-4 border-t">
                            <Table>
                                <TableBody>
                                    <TableRow className="bg-primary/5">
                                        <TableCell className="text-lg font-bold">Net Taxable Income</TableCell>
                                        <TableCell className="text-right text-lg font-bold text-primary">{formatCurrency(33500)}</TableCell>
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
                                    <h4 className="font-semibold">Income Tax (Graduated Rates)</h4>
                                    <p className="text-sm text-muted-foreground">Estimated at 25% effective rate per BIR tax table</p>
                                    <Progress value={80} className="mt-2 w-64" />
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-orange-600">{formatCurrency(6700)}</div>
                                    <Badge variant="outline" className="mt-1">80% of total</Badge>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <h4 className="font-semibold">Percentage Tax (Non-VAT)</h4>
                                    <p className="text-sm text-muted-foreground">3% of gross sales/receipts (if applicable)</p>
                                    <Progress value={15} className="mt-2 w-64" />
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-orange-600">{formatCurrency(1275)}</div>
                                    <Badge variant="outline" className="mt-1">15% of total</Badge>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <h4 className="font-semibold">Withholding Tax Credits</h4>
                                    <p className="text-sm text-muted-foreground">Creditable withholding tax from clients</p>
                                    <Progress value={5} className="mt-2 w-64" />
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-green-600">({formatCurrency(400)})</div>
                                    <Badge variant="outline" className="mt-1">Tax credit</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t-2">
                            <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                                <div>
                                    <h3 className="text-xl font-bold">Total Estimated Tax Liability</h3>
                                    <p className="text-sm text-muted-foreground mt-1">For tax year 2025</p>
                                </div>
                                <div className="text-3xl font-bold text-orange-600">{formatCurrency(8375)}</div>
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
                            <TableRow>
                                <TableCell className="font-medium">Q1 2025</TableCell>
                                <TableCell>May 15, 2025</TableCell>
                                <TableCell className="text-right">{formatCurrency(2094)}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="default" className="bg-green-600">Paid</Badge>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Q2 2025</TableCell>
                                <TableCell>August 15, 2025</TableCell>
                                <TableCell className="text-right">{formatCurrency(2094)}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="default" className="bg-green-600">Paid</Badge>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Q3 2025</TableCell>
                                <TableCell>November 15, 2025</TableCell>
                                <TableCell className="text-right">{formatCurrency(2094)}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="default" className="bg-green-600">Paid</Badge>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Q4 2025</TableCell>
                                <TableCell>January 25, 2026</TableCell>
                                <TableCell className="text-right">{formatCurrency(2094)}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="outline" className="text-orange-600">Due Soon</Badge>
                                </TableCell>
                            </TableRow>
                            <TableRow className="border-t-2 bg-muted/30">
                                <TableCell colSpan={2} className="font-bold">Total Annual Payment</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(8375)}</TableCell>
                                <TableCell></TableCell>
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
                            { name: "BIR Form 1701Q - Quarterly Income Tax Return", form: "1701Q", status: "Draft" },
                            { name: "BIR Form 2551Q - Quarterly Percentage Tax", form: "2551Q", status: "Ready" },
                            { name: "BIR Form 0605 - Payment Form", form: "0605", status: "Completed" },
                            { name: "Annual Income Tax Return (1701)", form: "1701", status: "Pending" },
                        ].map((doc, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">{doc.name}</p>
                                        <p className="text-sm text-muted-foreground">{doc.form}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant={doc.status === "Completed" ? "default" : "outline"}>
                                        {doc.status}
                                    </Badge>
                                    <Button variant="ghost" size="sm">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Important Notice */}
            <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important Tax Notice</AlertTitle>
                <AlertDescription>
                    These are estimated tax calculations based on your current financial data. Tax laws are complex and change frequently. 
                    Please consult with a qualified tax professional or CPA for accurate tax planning, filing, and compliance with all applicable tax regulations.
                </AlertDescription>
            </Alert>
        </div>
    )
}
