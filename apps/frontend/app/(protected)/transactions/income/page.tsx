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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Download,
    MoreHorizontal,
    Search,
    TrendingUp,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Transaction {
    id: string
    date: string
    description: string
    category: string
    amount: number
    status: "completed" | "pending"
    client?: string
}

const incomeTransactions: Transaction[] = [
    {
        id: "TXN-001",
        date: "2025-11-20",
        description: "Consulting Services - ABC Corp",
        category: "Professional Services",
        amount: 5000.00,
        status: "completed",
        client: "ABC Corp"
    },
    {
        id: "TXN-003",
        date: "2025-11-18",
        description: "Monthly Retainer - XYZ Inc",
        category: "Recurring Revenue",
        amount: 3500.00,
        status: "completed",
        client: "XYZ Inc"
    },
    {
        id: "TXN-005",
        date: "2025-11-15",
        description: "Project Payment - Tech Solutions",
        category: "Project Revenue",
        amount: 8750.00,
        status: "pending",
        client: "Tech Solutions"
    },
]

export default function IncomePage() {
    const [transactions] = useState<Transaction[]>(incomeTransactions)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = filterStatus === "all" || transaction.status === filterStatus
        const txDate = new Date(transaction.date)
        const withinStart = !startDate || txDate >= new Date(startDate)
        const withinEnd = !endDate || txDate <= new Date(endDate)
        return matchesSearch && matchesStatus && withinStart && withinEnd
    })

    const totalIncome = transactions
        .filter(t => t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0)

    const pendingIncome = transactions.filter(t => t.status === "pending").reduce((sum, t) => sum + t.amount, 0)
    const completionPct = (totalIncome + pendingIncome) > 0 ? (totalIncome / (totalIncome + pendingIncome)) * 100 : 0
    const pendingSharePct = (totalIncome + pendingIncome) > 0 ? (pendingIncome / (totalIncome + pendingIncome)) * 100 : 0

    return (
        <div className="flex flex-col gap-6 pb-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Income Transactions</h1>
                    <p className="text-muted-foreground mt-1">Track all your income and revenue streams</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
                        <div className="rounded-full bg-green-500/10 p-2.5 group-hover:bg-green-500/20 transition-colors duration-300 group-hover:scale-110">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                                                <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                                                        <TrendingUp className="h-3 w-3" />
                                                        <span>{completionPct.toFixed(1)}%</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">completion</p>
                                                </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Income</CardTitle>
                        <div className="rounded-full bg-blue-500/10 p-2.5 group-hover:bg-blue-500/20 transition-colors duration-300 group-hover:scale-110">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                                                <div className="text-2xl font-bold">{formatCurrency(pendingIncome)}</div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                                        <TrendingUp className="h-3 w-3" />
                                                        <span>{pendingSharePct.toFixed(1)}%</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">pending share</p>
                                                </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
                        <div className="rounded-full bg-purple-500/10 p-2.5 group-hover:bg-purple-500/20 transition-colors duration-300 group-hover:scale-110">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{transactions.length}</div>
                        <p className="text-xs text-muted-foreground mt-2">This period</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card className="border-border/50">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                    <CardTitle>Income Transactions</CardTitle>
                    <CardDescription>All income and revenue transactions</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="grid gap-4 md:grid-cols-5">
                            <div className="relative md:col-span-2">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search transactions..."
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
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
                            <Input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
                        </div>
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" className="hover:bg-accent/50">
                                <Download className="mr-2 h-4 w-4" /> Export CSV
                            </Button>
                            {(startDate || endDate) && (
                              <Button variant="ghost" size="sm" className="ml-2" onClick={()=>{setStartDate('');setEndDate('')}}>
                                Clear Dates
                              </Button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell className="font-medium">{transaction.id}</TableCell>
                                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{transaction.description}</span>
                                                {transaction.client && (
                                                    <span className="text-xs text-muted-foreground">{transaction.client}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{transaction.category}</TableCell>
                                        <TableCell className="text-green-600 font-semibold">
                                            +{formatCurrency(transaction.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={transaction.status === "completed" ? "default" : "outline"}>
                                                {transaction.status}
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
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Edit Transaction</DropdownMenuItem>
                                                    <DropdownMenuItem>Download Receipt</DropdownMenuItem>
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


