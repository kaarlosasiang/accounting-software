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
                <AlertTitle>Tax Filing Reminder</AlertTitle>
                <AlertDescription>
                    Q4 2025 estimated tax payment is due on January 15, 2026. Your estimated payment is {formatCurrency(7941.93)}.
                </AlertDescription>
            </Alert>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(88700)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total income for 2025</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Deductions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(13599)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Tax-deductible expenses</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Taxable Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(75101)}</div>
                        <p className="text-xs text-muted-foreground mt-1">After deductions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Est. Tax Liability</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(31768)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total estimated taxes</p>
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
                                        <TableCell>Professional Services</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(45000)}</TableCell>
                                        <TableCell className="text-right">50.7%</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Consulting Revenue</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(28500)}</TableCell>
                                        <TableCell className="text-right">32.1%</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Recurring Revenue</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(15200)}</TableCell>
                                        <TableCell className="text-right">17.2%</TableCell>
                                    </TableRow>
                                    <TableRow className="border-t-2 bg-muted/30">
                                        <TableCell className="font-bold">Total Gross Income</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(88700)}.00</TableCell>
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
                                        <TableCell>Office Expenses</TableCell>
                                        <TableCell className="text-right">{formatCurrency(3450)}</TableCell>
                                        <TableCell className="text-right">100%</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(3450)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Software & Tools</TableCell>
                                        <TableCell className="text-right">{formatCurrency(1299)}</TableCell>
                                        <TableCell className="text-right">100%</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(1299)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Professional Services</TableCell>
                                        <TableCell className="text-right">{formatCurrency(2800)}</TableCell>
                                        <TableCell className="text-right">100%</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(2800)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Marketing & Advertising</TableCell>
                                        <TableCell className="text-right">{formatCurrency(4200)}</TableCell>
                                        <TableCell className="text-right">100%</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(4200)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Travel & Entertainment</TableCell>
                                        <TableCell className="text-right">{formatCurrency(2100)}</TableCell>
                                        <TableCell className="text-right">50%</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(1050)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Home Office</TableCell>
                                        <TableCell className="text-right">{formatCurrency(1600)}</TableCell>
                                        <TableCell className="text-right">50%</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(800)}</TableCell>
                                    </TableRow>
                                    <TableRow className="border-t-2 bg-green-50 dark:bg-green-950/20">
                                        <TableCell className="font-bold">Total Deductions</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(15449)}</TableCell>
                                        <TableCell className="text-right"></TableCell>
                                        <TableCell className="text-right font-bold text-green-600">{formatCurrency(13599)}.00</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        <div className="pt-4 border-t">
                            <Table>
                                <TableBody>
                                    <TableRow className="bg-primary/5">
                                        <TableCell className="text-lg font-bold">Net Taxable Income</TableCell>
                                        <TableCell className="text-right text-lg font-bold text-primary">{formatCurrency(75101)}.00</TableCell>
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
                    <CardTitle>Estimated Tax Liability</CardTitle>
                    <CardDescription>
                        Breakdown of federal, state, and self-employment taxes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <h4 className="font-semibold">Federal Income Tax</h4>
                                    <p className="text-sm text-muted-foreground">Estimated at 22% marginal rate</p>
                                    <Progress value={52} className="mt-2 w-64" />
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-orange-600">{formatCurrency(16522.22)}</div>
                                    <Badge variant="outline" className="mt-1">52% of total</Badge>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <h4 className="font-semibold">State Income Tax</h4>
                                    <p className="text-sm text-muted-foreground">Estimated at 5% state rate</p>
                                    <Progress value={12} className="mt-2 w-64" />
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-orange-600">{formatCurrency(3755.05)}</div>
                                    <Badge variant="outline" className="mt-1">12% of total</Badge>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <h4 className="font-semibold">Self-Employment Tax</h4>
                                    <p className="text-sm text-muted-foreground">15.3% (Social Security + Medicare)</p>
                                    <Progress value={36} className="mt-2 w-64" />
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-orange-600">{formatCurrency(11490.45)}</div>
                                    <Badge variant="outline" className="mt-1">36% of total</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t-2">
                            <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                                <div>
                                    <h3 className="text-xl font-bold">Total Estimated Tax Liability</h3>
                                    <p className="text-sm text-muted-foreground mt-1">For tax year 2025</p>
                                </div>
                                <div className="text-3xl font-bold text-orange-600">{formatCurrency(31767.72)}</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quarterly Payments */}
            <Card>
                <CardHeader>
                    <CardTitle>Quarterly Estimated Tax Payments</CardTitle>
                    <CardDescription>
                        Schedule and track your quarterly tax payments
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
                                <TableCell>April 15, 2025</TableCell>
                                <TableCell className="text-right">{formatCurrency(7941.93)}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="default" className="bg-green-600">Paid</Badge>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Q2 2025</TableCell>
                                <TableCell>June 15, 2025</TableCell>
                                <TableCell className="text-right">{formatCurrency(7941.93)}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="default" className="bg-green-600">Paid</Badge>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Q3 2025</TableCell>
                                <TableCell>September 15, 2025</TableCell>
                                <TableCell className="text-right">{formatCurrency(7941.93)}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="default" className="bg-green-600">Paid</Badge>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Q4 2025</TableCell>
                                <TableCell>January 15, 2026</TableCell>
                                <TableCell className="text-right">{formatCurrency(7941.93)}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="outline" className="text-orange-600">Due Soon</Badge>
                                </TableCell>
                            </TableRow>
                            <TableRow className="border-t-2 bg-muted/30">
                                <TableCell colSpan={2} className="font-bold">Total Annual Payment</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(31767.72)}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Tax Documents */}
            <Card>
                <CardHeader>
                    <CardTitle>Tax Documents & Forms</CardTitle>
                    <CardDescription>
                        Download and manage your tax-related documents
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[
                            { name: "Schedule C - Profit or Loss from Business", form: "Schedule C", status: "Draft" },
                            { name: "Form 1040-ES - Estimated Tax Worksheet", form: "1040-ES", status: "Ready" },
                            { name: "Form W-9 - Request for Taxpayer ID", form: "W-9", status: "Completed" },
                            { name: "Income & Expense Report 2025", form: "Report", status: "Ready" },
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
