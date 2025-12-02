"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Download,
    MoreHorizontal,
    Search,
    CheckCircle2,
    TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

interface Invoice {
    id: string
    invoiceNumber: string
    client: string
    clientEmail: string
    issueDate: string
    paidDate: string
    amount: number
}

const paidInvoices: Invoice[] = [
    {
        id: "INV-001",
        invoiceNumber: "2025-001",
        client: "ABC Corporation",
        clientEmail: "billing@abccorp.com",
        issueDate: "2025-11-01",
        paidDate: "2025-11-15",
        amount: 5000.00
    },
]

export default function PaidInvoicesPage() {
    const [invoices] = useState<Invoice[]>(paidInvoices)
    const [searchQuery, setSearchQuery] = useState("")
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")

    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch = invoice.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
        const txDate = new Date(invoice.paidDate)
        const withinStart = !startDate || txDate >= new Date(startDate)
        const withinEnd = !endDate || txDate <= new Date(endDate)
        return matchesSearch && withinStart && withinEnd
    })

    const totalPaid = invoices.reduce((sum, inv) => sum + inv.amount, 0)
    const avgInvoiceAmount = invoices.length > 0 ? totalPaid / invoices.length : 0

    return (
        <div className="flex flex-col gap-6 pb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Paid Invoices</h1>
                    <p className="text-muted-foreground mt-1">Completed and paid invoices</p>
                </div>
                <Link href="/invoices/create">
                    <Button className="shadow-md hover:shadow-lg transition-all">Create Invoice</Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
                        <div className="rounded-full bg-green-500/10 p-2.5 group-hover:bg-green-500/20 transition-colors duration-300 group-hover:scale-110">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                            <TrendingUp className="h-3 w-3" />
                            <span>{formatCurrency(avgInvoiceAmount)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">avg invoice</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{invoices.length} invoices</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/50">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                    <CardTitle>Paid Invoices</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="relative md:col-span-2">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search invoices..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
                            <Input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="hover:bg-accent/50">
                                <Download className="mr-2 h-4 w-4" /> Export CSV
                            </Button>
                            {(startDate || endDate) && (
                              <Button variant="ghost" size="sm" onClick={()=>{setStartDate('');setEndDate('')}}>Clear Dates</Button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Issue Date</TableHead>
                                    <TableHead>Paid Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInvoices.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{invoice.client}</span>
                                                <span className="text-xs text-muted-foreground">{invoice.clientEmail}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{new Date(invoice.paidDate).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-semibold text-green-600">
                                            {formatCurrency(invoice.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge>paid</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>View Invoice</DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Download PDF
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>Send Receipt</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

