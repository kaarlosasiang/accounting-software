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
    TableRow,
} from "@/components/ui/table"
import { Download, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function BalanceSheetPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Balance Sheet</h1>
                    <p className="text-muted-foreground mt-2">
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
                    <CardTitle>Balance Sheet as of November 20, 2025</CardTitle>
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
                            <div className="ml-4 mb-6">
                                <h4 className="text-lg font-semibold mb-3">Current Assets</h4>
                                <Table>
                                    <TableBody>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Cash and Cash Equivalents</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(85200)}</TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Accounts Receivable</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(35250)}</TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Prepaid Expenses</TableCell>
                                            <TableCell className="text-right font-medium">$5,000.00</TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Inventory</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(12450)}</TableCell>
                                        </TableRow>
                                        <TableRow className="border-t bg-muted/30">
                                            <TableCell className="pl-4 font-semibold">Total Current Assets</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(137900)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Fixed Assets */}
                            <div className="ml-4 mb-6">
                                <h4 className="text-lg font-semibold mb-3">Fixed Assets</h4>
                                <Table>
                                    <TableBody>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Property and Equipment</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(75000)}</TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Less: Accumulated Depreciation</TableCell>
                                            <TableCell className="text-right font-medium text-red-600">({formatCurrency(15000)})</TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Furniture and Fixtures</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(20000)}</TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Less: Accumulated Depreciation</TableCell>
                                            <TableCell className="text-right font-medium text-red-600">($5,000.00)</TableCell>
                                        </TableRow>
                                        <TableRow className="border-t bg-muted/30">
                                            <TableCell className="pl-4 font-semibold">Total Fixed Assets</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(75000)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Intangible Assets */}
                            <div className="ml-4 mb-6">
                                <h4 className="text-lg font-semibold mb-3">Intangible Assets</h4>
                                <Table>
                                    <TableBody>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Goodwill</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(25000)}</TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Patents and Trademarks</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(10000)}</TableCell>
                                        </TableRow>
                                        <TableRow className="border-t bg-muted/30">
                                            <TableCell className="pl-4 font-semibold">Total Intangible Assets</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(35000)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            <Table>
                                <TableBody>
                                    <TableRow className="border-t-2 bg-blue-50 dark:bg-blue-950/20">
                                        <TableCell className="text-lg font-bold">TOTAL ASSETS</TableCell>
                                        <TableCell className="text-right text-lg font-bold text-blue-600">{formatCurrency(247900)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        {/* Liabilities Section */}
                        <div className="pt-8 border-t-2">
                            <h3 className="text-xl font-bold mb-4 text-red-600">LIABILITIES</h3>
                            
                            {/* Current Liabilities */}
                            <div className="ml-4 mb-6">
                                <h4 className="text-lg font-semibold mb-3">Current Liabilities</h4>
                                <Table>
                                    <TableBody>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Accounts Payable</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(15200)}</TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Accrued Expenses</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(8150)}</TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Short-term Debt</TableCell>
                                            <TableCell className="text-right font-medium">$5,000.00</TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Unearned Revenue</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(7500)}</TableCell>
                                        </TableRow>
                                        <TableRow className="border-t bg-muted/30">
                                            <TableCell className="pl-4 font-semibold">Total Current Liabilities</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(35850)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Long-term Liabilities */}
                            <div className="ml-4 mb-6">
                                <h4 className="text-lg font-semibold mb-3">Long-term Liabilities</h4>
                                <Table>
                                    <TableBody>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Long-term Debt</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(40000)}</TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Deferred Tax Liabilities</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(5950)}</TableCell>
                                        </TableRow>
                                        <TableRow className="border-t bg-muted/30">
                                            <TableCell className="pl-4 font-semibold">Total Long-term Liabilities</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(45950)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            <Table>
                                <TableBody>
                                    <TableRow className="border-t-2 bg-red-50 dark:bg-red-950/20">
                                        <TableCell className="text-lg font-bold">TOTAL LIABILITIES</TableCell>
                                        <TableCell className="text-right text-lg font-bold text-red-600">{formatCurrency(81800)}</TableCell>
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
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Owner&apos;s Equity</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(100000)}</TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell className="pl-8">Retained Earnings</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(66100)}</TableCell>
                                        </TableRow>
                                        <TableRow className="border-t-2 bg-green-50 dark:bg-green-950/20">
                                            <TableCell className="text-lg font-bold">TOTAL EQUITY</TableCell>
                                            <TableCell className="text-right text-lg font-bold text-green-600">{formatCurrency(166100)}</TableCell>
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
                                        <TableCell className="text-xl font-bold">TOTAL LIABILITIES & EQUITY</TableCell>
                                        <TableCell className="text-right text-xl font-bold text-primary">{formatCurrency(247900)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                                ✓ Balance Sheet is balanced (Assets = Liabilities + Equity)
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
                        <div className="text-2xl font-bold">3.85</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Current Assets / Current Liabilities
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Debt-to-Equity Ratio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0.49</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total Liabilities / Total Equity
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Working Capital</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(102050)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Current Assets - Current Liabilities
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
