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
import { Download, FileText } from "lucide-react"

export default function ProfitLossPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profit & Loss Statement</h1>
                    <p className="text-muted-foreground">
                        Income and expenses for the selected period
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
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        <CardTitle>Profit & Loss Statement</CardTitle>
                    </div>
                    <CardDescription>
                        For the year ended December 31, 2025
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
        </div>
    )
}

