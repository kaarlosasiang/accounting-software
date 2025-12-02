"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Plus, Search, FileText, Download, Eye, Edit, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"

interface Bill {
    id: string
    billNumber: string
    supplier: string
    supplierEmail: string
    billDate: string
    dueDate: string
    amount: number
    status: "draft" | "open" | "partial" | "paid" | "overdue" | "void"
    items: number
    serviceType: "Food" | "Non-Food" | "Services" | "Supplies"
    description: string
}

const mockBills: Bill[] = [
    {
        id: "BILL-001",
        billNumber: "2025-B001",
        supplier: "Manila Rice Trading",
        supplierEmail: "accounts@manilarice.com",
        billDate: "2025-11-01",
        dueDate: "2025-11-30",
        amount: 11250.00,
        status: "paid",
        items: 1,
        serviceType: "Food",
        description: "5 sacks of 50kg premium rice supply"
    },
    {
        id: "BILL-002",
        billNumber: "2025-B002",
        supplier: "Metro Cleaning Supplies",
        supplierEmail: "billing@metrocleaning.ph",
        billDate: "2025-11-10",
        dueDate: "2025-12-10",
        amount: 3500.00,
        status: "open",
        items: 3,
        serviceType: "Non-Food",
        description: "Monthly janitorial supplies bundle"
    },
    {
        id: "BILL-003",
        billNumber: "2025-B003",
        supplier: "Beauty Products Wholesalers",
        supplierEmail: "sales@beautyproducts.ph",
        billDate: "2025-11-15",
        dueDate: "2025-12-15",
        amount: 5250.00,
        status: "open",
        items: 8,
        serviceType: "Supplies",
        description: "Salon supplies - shampoo, conditioner, styling products"
    },
    {
        id: "BILL-004",
        billNumber: "2025-B004",
        supplier: "Quick Canned Goods Distributor",
        supplierEmail: "accounts@quickcanned.com",
        billDate: "2025-10-20",
        dueDate: "2025-11-19",
        amount: 3250.00,
        status: "overdue",
        items: 2,
        serviceType: "Food",
        description: "50 cases assorted canned goods"
    },
    {
        id: "BILL-005",
        billNumber: "2025-B005",
        supplier: "Office Depot Manila",
        supplierEmail: "billing@officedepot.ph",
        billDate: "2025-11-18",
        dueDate: "2025-12-18",
        amount: 3750.00,
        status: "draft",
        items: 5,
        serviceType: "Non-Food",
        description: "Office supplies - paper, pens, folders"
    },
]

export default function BillsPage() {
    const [bills] = useState<Bill[]>(mockBills)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    const filteredBills = bills.filter((bill) => {
        const matchesSearch =
            bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bill.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bill.id.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === "all" || bill.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0)
    const paidAmount = bills
        .filter((bill) => bill.status === "paid")
        .reduce((sum, bill) => sum + bill.amount, 0)
    const pendingAmount = bills
        .filter((bill) => bill.status === "open" || bill.status === "partial")
        .reduce((sum, bill) => sum + bill.amount, 0)
    const overdueAmount = bills
        .filter((bill) => bill.status === "overdue")
        .reduce((sum, bill) => sum + bill.amount, 0)

    const getStatusBadge = (status: Bill["status"]) => {
        const variants = {
            draft: "bg-gray-500/10 text-gray-600 border-gray-500/20",
            open: "bg-blue-500/10 text-blue-600 border-blue-500/20",
            partial: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
            paid: "bg-green-500/10 text-green-600 border-green-500/20",
            overdue: "bg-red-500/10 text-red-600 border-red-500/20",
            void: "bg-gray-400/10 text-gray-500 border-gray-400/20",
        }

        return (
            <Badge variant="outline" className={variants[status]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                        Bills & Payables
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your supplier bills and payables
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Link href="/bills/create">
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Bill
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                        <p className="text-xs text-muted-foreground">
                            {bills.length} {bills.length === 1 ? 'bill' : 'bills'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paid</CardTitle>
                        <FileText className="h-4 w-4 text-green-600 group-hover:text-green-500 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(paidAmount)}</div>
                        <p className="text-xs text-muted-foreground">
                            {((paidAmount / totalAmount) * 100).toFixed(1)}% paid
                        </p>
                    </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <FileText className="h-4 w-4 text-blue-600 group-hover:text-blue-500 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
                        <p className="text-xs text-muted-foreground">
                            {((pendingAmount / totalAmount) * 100).toFixed(1)}% pending
                        </p>
                    </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                        <FileText className="h-4 w-4 text-red-600 group-hover:text-red-500 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(overdueAmount)}</div>
                        <p className="text-xs text-muted-foreground">
                            {overdueAmount > 0 ? `${((overdueAmount / totalAmount) * 100).toFixed(1)}% overdue` : 'No overdue bills'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div>
                            <CardTitle>All Bills</CardTitle>
                            <CardDescription>
                                View and manage all supplier bills
                            </CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search bills..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="partial">Partial</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                    <SelectItem value="void">Void</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Bill #</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Bill Date</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBills.map((bill) => (
                                    <TableRow key={bill.id}>
                                        <TableCell className="font-medium">{bill.billNumber}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{bill.supplier}</span>
                                                <span className="text-xs text-muted-foreground">{bill.supplierEmail}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                bill.serviceType === "Supplies" ? "bg-purple-500/10 text-purple-600 border-purple-500/20" :
                                                bill.serviceType === "Food" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                                "bg-green-500/10 text-green-600 border-green-500/20"
                                            }>
                                                {bill.serviceType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">{bill.description}</span>
                                        </TableCell>
                                        <TableCell>{new Date(bill.billDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <span className={bill.status === "overdue" ? "text-red-600 font-medium" : ""}>
                                                {new Date(bill.dueDate).toLocaleDateString()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-medium">{formatCurrency(bill.amount)}</TableCell>
                                        <TableCell>{getStatusBadge(bill.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600">
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        Delete
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
