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
    TrendingDown,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Transaction {
    id: string
    date: string
    description: string
    category: string
    amount: number
    status: "completed" | "pending"
}

const expenseTransactions: Transaction[] = [
    {
        id: "TXN-002",
        date: "2025-11-19",
        description: "Office Supplies - Staples",
        category: "Office Expenses",
        amount: 324.50,
        status: "completed",
    },
    {
        id: "TXN-004",
        date: "2025-11-17",
        description: "Software Subscription - Adobe",
        category: "Software & Tools",
        amount: 79.99,
        status: "completed",
    },
    {
        id: "TXN-006",
        date: "2025-11-16",
        description: "Marketing Campaign - Google Ads",
        category: "Marketing & Advertising",
        amount: 450.00,
        status: "completed",
    },
    {
        id: "TXN-007",
        date: "2025-11-14",
        description: "Office Rent - November",
        category: "Office Expenses",
        amount: 2500.00,
        status: "completed",
    },
]

export default function ExpensesPage() {
    const [transactions] = useState<Transaction[]>(expenseTransactions)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterCategory, setFilterCategory] = useState<string>("all")
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = filterCategory === "all" || transaction.category === filterCategory
        const txDate = new Date(transaction.date)
        const withinStart = !startDate || txDate >= new Date(startDate)
        const withinEnd = !endDate || txDate <= new Date(endDate)
        return matchesSearch && matchesCategory
    })

    const totalExpenses = transactions
        .filter(t => t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0)

    const categoryBreakdown = transactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
    }, {} as Record<string, number>)

    const topCategory = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0]
    const topCategoryPct = topCategory ? (topCategory[1] / totalExpenses) * 100 : 0
    const avgExpensePct = totalExpenses > 0 ? (totalExpenses / (transactions.length || 1)) : 0

    return (
        <div className="flex flex-col gap-6 pb-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Expense Transactions</h1>
                    <p className="text-muted-foreground mt-1">Track and manage all your business expenses</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                        <div className="rounded-full bg-red-500/10 p-2.5 group-hover:bg-red-500/20 transition-colors duration-300 group-hover:scale-110">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-xs text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full">
                            <TrendingDown className="h-3 w-3" />
                            <span>{avgExpensePct.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">avg per tx (₱)</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Top Category</CardTitle>
                        <div className="rounded-full bg-purple-500/10 p-2.5 group-hover:bg-purple-500/20 transition-colors duration-300 group-hover:scale-110">
                            <TrendingDown className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{topCategory?.[0] || 'N/A'}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full">
                            <TrendingDown className="h-3 w-3" />
                            <span>{topCategoryPct.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">of total</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
                        <div className="rounded-full bg-blue-500/10 p-2.5 group-hover:bg-blue-500/20 transition-colors duration-300 group-hover:scale-110">
                            <TrendingDown className="h-4 w-4 text-blue-600" />
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
                    <CardTitle>Expense Transactions</CardTitle>
                    <CardDescription>All business expense transactions</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="relative md:col-span-2">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search expenses..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="Office Expenses">Office Expenses</SelectItem>
                                    <SelectItem value="Software & Tools">Software & Tools</SelectItem>
                                    <SelectItem value="Marketing & Advertising">Marketing & Advertising</SelectItem>
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
                                        <TableCell className="font-medium">{transaction.description}</TableCell>
                                        <TableCell>{transaction.category}</TableCell>
                                        <TableCell className="text-red-600 font-semibold">
                                            -{formatCurrency(transaction.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="default">
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
                                                    <DropdownMenuItem>Edit Expense</DropdownMenuItem>
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

