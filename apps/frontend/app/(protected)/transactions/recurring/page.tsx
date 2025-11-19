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
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    MoreHorizontal,
    Search,
    Repeat,
    Plus,
    Pause,
    Play,
} from "lucide-react"

interface RecurringTransaction {
    id: string
    description: string
    category: string
    type: "income" | "expense"
    amount: number
    frequency: "weekly" | "monthly" | "quarterly" | "yearly"
    nextDate: string
    status: "active" | "paused"
    client?: string
}

const recurringTransactions: RecurringTransaction[] = [
    {
        id: "REC-001",
        description: "Monthly Retainer - XYZ Inc",
        category: "Recurring Revenue",
        type: "income",
        amount: 3500.00,
        frequency: "monthly",
        nextDate: "2025-12-01",
        status: "active",
        client: "XYZ Inc"
    },
    {
        id: "REC-002",
        description: "Office Rent",
        category: "Office Expenses",
        type: "expense",
        amount: 2500.00,
        frequency: "monthly",
        nextDate: "2025-12-01",
        status: "active"
    },
    {
        id: "REC-003",
        description: "Software Subscriptions",
        category: "Software & Tools",
        type: "expense",
        amount: 299.99,
        frequency: "monthly",
        nextDate: "2025-12-05",
        status: "active"
    },
    {
        id: "REC-004",
        description: "Quarterly Consulting - ABC Corp",
        category: "Professional Services",
        type: "income",
        amount: 15000.00,
        frequency: "quarterly",
        nextDate: "2026-01-01",
        status: "active",
        client: "ABC Corp"
    },
    {
        id: "REC-005",
        description: "Cloud Hosting Services",
        category: "Software & Tools",
        type: "expense",
        amount: 149.99,
        frequency: "monthly",
        nextDate: "2025-12-10",
        status: "paused"
    },
]

export default function RecurringTransactionsPage() {
    const [transactions] = useState<RecurringTransaction[]>(recurringTransactions)
    const [searchQuery, setSearchQuery] = useState("")

    const filteredTransactions = transactions.filter(transaction =>
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const activeIncome = transactions
        .filter(t => t.type === "income" && t.status === "active")
        .reduce((sum, t) => sum + t.amount, 0)

    const activeExpenses = transactions
        .filter(t => t.type === "expense" && t.status === "active")
        .reduce((sum, t) => sum + t.amount, 0)

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Recurring Transactions</h1>
                    <p className="text-muted-foreground">
                        Manage automated and recurring transactions
                    </p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Recurring Transaction
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Recurring Transaction</DialogTitle>
                            <DialogDescription>
                                Set up a new recurring transaction
                            </DialogDescription>
                        </DialogHeader>
                        <div className="text-center py-8 text-muted-foreground">
                            Recurring transaction form coming soon
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
                        <Repeat className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ${activeIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active recurring income
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                        <Repeat className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ${activeExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active recurring expenses
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Transactions</CardTitle>
                        <Repeat className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {transactions.filter(t => t.status === "active").length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {transactions.filter(t => t.status === "paused").length} paused
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recurring Transactions</CardTitle>
                    <CardDescription>
                        Automated transactions that repeat on a schedule
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search recurring transactions..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Frequency</TableHead>
                                    <TableHead>Next Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{transaction.description}</span>
                                                {transaction.client && (
                                                    <span className="text-xs text-muted-foreground">{transaction.client}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={transaction.type === "income" ? "default" : "secondary"}>
                                                {transaction.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{transaction.category}</TableCell>
                                        <TableCell className={transaction.type === "income" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                            {transaction.type === "income" ? "+" : "-"}${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="capitalize">{transaction.frequency}</TableCell>
                                        <TableCell>{new Date(transaction.nextDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={transaction.status === "active" ? "default" : "secondary"}>
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
                                                    <DropdownMenuItem>
                                                        {transaction.status === "active" ? (
                                                            <>
                                                                <Pause className="mr-2 h-4 w-4" />
                                                                Pause
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play className="mr-2 h-4 w-4" />
                                                                Resume
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>Edit Schedule</DropdownMenuItem>
                                                    <DropdownMenuItem>View History</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">
                                                        Delete Recurring Transaction
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

