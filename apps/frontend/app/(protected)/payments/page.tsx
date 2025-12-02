"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Plus, Search, CreditCard, Download, Eye, ArrowUpCircle, ArrowDownCircle } from "lucide-react"

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

interface Payment {
    id: string
    paymentNumber: string
    paymentDate: string
    paymentType: "Received" | "Made"
    paymentMethod: "Cash" | "Check" | "Bank Transfer" | "Credit Card" | "Other"
    referenceNumber: string
    amount: number
    entity: string
    entityEmail: string
    description: string
}

const mockPayments: Payment[] = [
    {
        id: "PAY-001",
        paymentNumber: "PMT-2025-001",
        paymentDate: "2025-11-28",
        paymentType: "Made",
        paymentMethod: "Bank Transfer",
        referenceNumber: "TXN-112820251",
        amount: 11250.00,
        entity: "Manila Rice Trading",
        entityEmail: "accounts@manilarice.com",
        description: "Payment for Bill #2025-B001"
    },
    {
        id: "PAY-002",
        paymentNumber: "PMT-2025-002",
        paymentDate: "2025-11-25",
        paymentType: "Received",
        paymentMethod: "Cash",
        referenceNumber: "CASH-001",
        amount: 2850.00,
        entity: "Maria's Salon",
        entityEmail: "billing@mariasalon.com",
        description: "Payment for Invoice #2025-001"
    },
    {
        id: "PAY-003",
        paymentNumber: "PMT-2025-003",
        paymentDate: "2025-11-20",
        paymentType: "Received",
        paymentMethod: "Bank Transfer",
        referenceNumber: "TXN-112020253",
        amount: 5250.00,
        entity: "Tech Solutions Office",
        entityEmail: "finance@techsol.com",
        description: "Payment for Invoice #2025-003"
    },
    {
        id: "PAY-004",
        paymentNumber: "PMT-2025-004",
        paymentDate: "2025-11-18",
        paymentType: "Made",
        paymentMethod: "Check",
        referenceNumber: "CHK-1234",
        amount: 3500.00,
        entity: "Metro Cleaning Supplies",
        entityEmail: "billing@metrocleaning.ph",
        description: "Payment for Bill #2025-B002"
    },
    {
        id: "PAY-005",
        paymentNumber: "PMT-2025-005",
        paymentDate: "2025-11-15",
        paymentType: "Received",
        paymentMethod: "Credit Card",
        referenceNumber: "CC-5678",
        amount: 12750.00,
        entity: "Juan's Grocery",
        entityEmail: "accounts@juangrocery.com",
        description: "Payment for Invoice #2025-002"
    },
]

export default function PaymentsPage() {
    const [payments] = useState<Payment[]>(mockPayments)
    const [searchQuery, setSearchQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")

    const filteredPayments = payments.filter((payment) => {
        const matchesSearch =
            payment.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesType = typeFilter === "all" || payment.paymentType === typeFilter

        return matchesSearch && matchesType
    })

    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0)
    const received = payments
        .filter((p) => p.paymentType === "Received")
        .reduce((sum, p) => sum + p.amount, 0)
    const made = payments
        .filter((p) => p.paymentType === "Made")
        .reduce((sum, p) => sum + p.amount, 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                        Payments
                    </h1>
                    <p className="text-muted-foreground">
                        Track all payment transactions
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Link href="/payments/create">
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Record Payment
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalPayments)}</div>
                        <p className="text-xs text-muted-foreground">
                            {payments.length} transactions
                        </p>
                    </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Received</CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-green-600 group-hover:text-green-500 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(received)}</div>
                        <p className="text-xs text-muted-foreground">
                            {payments.filter(p => p.paymentType === "Received").length} payments
                        </p>
                    </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Made</CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-red-600 group-hover:text-red-500 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(made)}</div>
                        <p className="text-xs text-muted-foreground">
                            {payments.filter(p => p.paymentType === "Made").length} payments
                        </p>
                    </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${received - made >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(received - made)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            This period
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div>
                            <CardTitle>All Payments</CardTitle>
                            <CardDescription>
                                View all payment transactions
                            </CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search payments..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full sm:w-[140px]">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="Received">Received</SelectItem>
                                    <SelectItem value="Made">Made</SelectItem>
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
                                    <TableHead>Payment #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Entity</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                payment.paymentType === "Received"
                                                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                    : "bg-red-500/10 text-red-600 border-red-500/20"
                                            }>
                                                {payment.paymentType === "Received" ? (
                                                    <ArrowUpCircle className="h-3 w-3 mr-1" />
                                                ) : (
                                                    <ArrowDownCircle className="h-3 w-3 mr-1" />
                                                )}
                                                {payment.paymentType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{payment.entity}</span>
                                                <span className="text-xs text-muted-foreground">{payment.entityEmail}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                                {payment.paymentMethod}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{payment.referenceNumber}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{payment.description}</TableCell>
                                        <TableCell className={`font-medium ${payment.paymentType === "Received" ? "text-green-600" : "text-red-600"}`}>
                                            {payment.paymentType === "Received" ? "+" : "-"}{formatCurrency(payment.amount)}
                                        </TableCell>
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
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Download Receipt
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
