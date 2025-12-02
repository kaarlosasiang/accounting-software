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
    dueDate: string
    amount: number
    status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
    items: number
    serviceType: "Food" | "Non-Food" | "Services"
    description: string
}

const mockInvoices: Invoice[] = [
    {
        id: "INV-001",
        invoiceNumber: "2025-001",
        client: "Maria's Salon",
        clientEmail: "billing@mariasalon.com",
        issueDate: "2025-11-01",
        dueDate: "2025-11-30",
        amount: 2850.00,
        status: "paid",
        items: 3,
        serviceType: "Services",
        description: "Hair styling and spa treatment services"
    },
    {
        id: "INV-002",
        invoiceNumber: "2025-002",
        client: "Juan's Grocery",
        clientEmail: "accounts@juangrocery.com",
        issueDate: "2025-11-10",
        dueDate: "2025-12-10",
        amount: 12750.00,
        status: "sent",
        items: 5,
        serviceType: "Food",
        description: "Rice, cooking oil, and canned goods bulk order"
    },
    {
        id: "INV-003",
        invoiceNumber: "2025-003",
        client: "Tech Solutions Office",
        clientEmail: "finance@techsol.com",
        issueDate: "2025-11-15",
        dueDate: "2025-12-15",
        amount: 5250.00,
        status: "sent",
        items: 4,
        serviceType: "Non-Food",
        description: "Cleaning supplies and office supplies package"
    },
    {
        id: "INV-004",
        invoiceNumber: "2025-004",
        client: "Beauty Bar Manila",
        clientEmail: "ap@beautybar.ph",
        issueDate: "2025-10-20",
        dueDate: "2025-11-19",
        amount: 1850.00,
        status: "overdue",
        items: 2,
        serviceType: "Services",
        description: "Manicure and pedicure services"
    },
    {
        id: "INV-005",
        invoiceNumber: "2025-005",
        client: "Pedro's Carinderia",
        clientEmail: "billing@pedros.ph",
        issueDate: "2025-11-18",
        dueDate: "2025-12-18",
        amount: 8500.00,
        status: "draft",
        items: 6,
        serviceType: "Food",
        description: "Weekly food supplies - vegetables and condiments"
    },
]

export default function InvoicesPage() {
    const [invoices] = useState<Invoice[]>(mockInvoices)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")

    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch =
            invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.id.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = filterStatus === "all" || invoice.status === filterStatus
        const txDate = new Date(invoice.issueDate)
        const withinStart = !startDate || txDate >= new Date(startDate)
        const withinEnd = !endDate || txDate <= new Date(endDate)
        return matchesSearch && matchesStatus && withinStart && withinEnd
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
    const paidPct = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
    const pendingPct = totalAmount > 0 ? (pendingAmount / totalAmount) * 100 : 0
    const overduePct = totalAmount > 0 ? (overdueAmount / totalAmount) * 100 : 0
    const collectionRate = (paidAmount + pendingAmount + overdueAmount) > 0 ? (paidAmount / (paidAmount + pendingAmount + overdueAmount)) * 100 : 0

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
        <div className="flex flex-col gap-6 pb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Invoices</h1>
                    <p className="text-muted-foreground mt-1">Create, send, and manage your invoices</p>
                </div>
                <Link href="/invoices/create">
                    <Button className="shadow-md hover:shadow-lg transition-all">
                        <Plus className="mr-2 h-4 w-4" /> Create Invoice
                    </Button>
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoiced</CardTitle>
                        <div className="rounded-full bg-purple-500/10 p-2.5 group-hover:bg-purple-500/20 transition-colors duration-300 group-hover:scale-110">
                            <FileText className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full">
                            <FileText className="h-3 w-3" />
                            <span>{collectionRate.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">collection rate</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{invoices.length} invoices</p>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
                        <div className="rounded-full bg-green-500/10 p-2.5 group-hover:bg-green-500/20 transition-colors duration-300 group-hover:scale-110">
                            <FileText className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(paidAmount)}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                            <TrendingUp className="h-3 w-3" />
                            <span>{paidPct.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">of total</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{invoices.filter(i => i.status === "paid").length} invoices</p>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                        <div className="rounded-full bg-blue-500/10 p-2.5 group-hover:bg-blue-500/20 transition-colors duration-300 group-hover:scale-110">
                            <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">
                            <FileText className="h-3 w-3" />
                            <span>{pendingPct.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">of total</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{invoices.filter(i => i.status === "sent").length} invoices</p>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
                        <div className="rounded-full bg-red-500/10 p-2.5 group-hover:bg-red-500/20 transition-colors duration-300 group-hover:scale-110">
                            <FileText className="h-4 w-4 text-red-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(overdueAmount)}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-xs text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full">
                            <FileText className="h-3 w-3" />
                            <span>{overduePct.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">of total</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{invoices.filter(i => i.status === "overdue").length} invoices</p>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices Table */}
            <Card className="border-border/50">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                    <CardTitle>All Invoices</CardTitle>
                    <CardDescription>Manage your invoices and track payments</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="grid gap-4 md:grid-cols-6">
                            <div className="relative md:col-span-2">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search invoices..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-full">
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
                            <Input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} placeholder="Start date" />
                            <Input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} placeholder="End date" />
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
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
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
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                invoice.serviceType === "Services" ? "bg-purple-500/10 text-purple-600 border-purple-500/20" :
                                                invoice.serviceType === "Food" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                                "bg-green-500/10 text-green-600 border-green-500/20"
                                            }>
                                                {invoice.serviceType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">{invoice.description}</span>
                                        </TableCell>
                                        <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <span className={invoice.status === "overdue" ? "text-red-600 font-medium" : ""}>
                                                {new Date(invoice.dueDate).toLocaleDateString()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {formatCurrency(invoice.amount)}
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

