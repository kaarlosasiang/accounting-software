"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
    Download,
    MoreHorizontal,
    Plus,
    Search,
    FileText,
    Send,
    Eye,
    Edit,
} from "lucide-react"
import Link from "next/link"

interface Invoice {
    id: string
    invoiceNumber: string
    client: string
    clientEmail: string
    issueDate: string
    dueDate: string
    amount: number
    status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
    items: number
}

const mockInvoices: Invoice[] = [
    {
        id: "INV-001",
        invoiceNumber: "2025-001",
        client: "ABC Corporation",
        clientEmail: "billing@abccorp.com",
        issueDate: "2025-11-01",
        dueDate: "2025-11-30",
        amount: 5000.00,
        status: "paid",
        items: 3
    },
    {
        id: "INV-002",
        invoiceNumber: "2025-002",
        client: "XYZ Industries",
        clientEmail: "accounts@xyzind.com",
        issueDate: "2025-11-10",
        dueDate: "2025-12-10",
        amount: 3500.00,
        status: "sent",
        items: 2
    },
    {
        id: "INV-003",
        invoiceNumber: "2025-003",
        client: "Tech Solutions Ltd",
        clientEmail: "finance@techsol.com",
        issueDate: "2025-11-15",
        dueDate: "2025-12-15",
        amount: 8750.00,
        status: "sent",
        items: 5
    },
    {
        id: "INV-004",
        invoiceNumber: "2025-004",
        client: "Global Enterprises",
        clientEmail: "ap@globalent.com",
        issueDate: "2025-10-20",
        dueDate: "2025-11-19",
        amount: 2250.00,
        status: "overdue",
        items: 2
    },
    {
        id: "INV-005",
        invoiceNumber: "2025-005",
        client: "Startup Inc",
        clientEmail: "billing@startup.io",
        issueDate: "2025-11-18",
        dueDate: "2025-12-18",
        amount: 4500.00,
        status: "draft",
        items: 4
    },
]

export default function InvoicesPage() {
    const [invoices] = useState<Invoice[]>(mockInvoices)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")

    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch =
            invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.id.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = filterStatus === "all" || invoice.status === filterStatus
        return matchesSearch && matchesStatus
    })

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)
    const paidAmount = invoices
        .filter(inv => inv.status === "paid")
        .reduce((sum, inv) => sum + inv.amount, 0)
    const pendingAmount = invoices
        .filter(inv => inv.status === "sent")
        .reduce((sum, inv) => sum + inv.amount, 0)
    const overdueAmount = invoices
        .filter(inv => inv.status === "overdue")
        .reduce((sum, inv) => sum + inv.amount, 0)

    const getStatusColor = (status: Invoice["status"]) => {
        switch (status) {
            case "paid": return "default"
            case "sent": return "outline"
            case "overdue": return "destructive"
            case "draft": return "secondary"
            case "cancelled": return "secondary"
            default: return "outline"
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
                    <p className="text-muted-foreground">
                        Create, send, and manage your invoices
                    </p>
                </div>
                <Link href="/invoices/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Invoice
                    </Button>
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {invoices.length} invoices
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paid</CardTitle>
                        <FileText className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {invoices.filter(i => i.status === "paid").length} invoices
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <FileText className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            ${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {invoices.filter(i => i.status === "sent").length} invoices
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                        <FileText className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ${overdueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {invoices.filter(i => i.status === "overdue").length} invoices
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Invoices</CardTitle>
                    <CardDescription>
                        Manage your invoices and track payments
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search invoices..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon">
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Issue Date</TableHead>
                                    <TableHead>Due Date</TableHead>
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
                                        <TableCell>
                                            <span className={invoice.status === "overdue" ? "text-red-600 font-medium" : ""}>
                                                {new Date(invoice.dueDate).toLocaleDateString()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusColor(invoice.status)}>
                                                {invoice.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Invoice
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit Invoice
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Send className="mr-2 h-4 w-4" />
                                                        Send to Client
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Download PDF
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive">
                                                        Delete Invoice
                                                    </DropdownMenuItem>
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

