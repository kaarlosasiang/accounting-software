"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  Search,
  Repeat,
  Plus,
  Pause,
  Play,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RecurringTransaction {
  id: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  nextDate: string;
  status: "active" | "paused";
  client?: string;
}

const recurringTransactions: RecurringTransaction[] = [
  {
    id: "REC-001",
    description: "Monthly Retainer - XYZ Inc",
    category: "Recurring Revenue",
    type: "income",
    amount: 3500.0,
    frequency: "monthly",
    nextDate: "2025-12-01",
    status: "active",
    client: "XYZ Inc",
  },
  {
    id: "REC-002",
    description: "Office Rent",
    category: "Office Expenses",
    type: "expense",
    amount: 2500.0,
    frequency: "monthly",
    nextDate: "2025-12-01",
    status: "active",
  },
  {
    id: "REC-003",
    description: "Software Subscriptions",
    category: "Software & Tools",
    type: "expense",
    amount: 299.99,
    frequency: "monthly",
    nextDate: "2025-12-05",
    status: "active",
  },
  {
    id: "REC-004",
    description: "Quarterly Consulting - ABC Corp",
    category: "Professional Services",
    type: "income",
    amount: 15000.0,
    frequency: "quarterly",
    nextDate: "2026-01-01",
    status: "active",
    client: "ABC Corp",
  },
  {
    id: "REC-005",
    description: "Cloud Hosting Services",
    category: "Software & Tools",
    type: "expense",
    amount: 149.99,
    frequency: "monthly",
    nextDate: "2025-12-10",
    status: "paused",
  },
];

export default function RecurringTransactionsPage() {
  const [transactions] = useState<RecurringTransaction[]>(
    recurringTransactions,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const txDate = new Date(transaction.nextDate);
    const withinStart = !startDate || txDate >= new Date(startDate);
    const withinEnd = !endDate || txDate <= new Date(endDate);
    return matchesSearch && withinStart && withinEnd;
  });

  const activeIncome = transactions
    .filter((t) => t.type === "income" && t.status === "active")
    .reduce((sum, t) => sum + t.amount, 0);

  const activeExpenses = transactions
    .filter((t) => t.type === "expense" && t.status === "active")
    .reduce((sum, t) => sum + t.amount, 0);
  const activeCount = transactions.filter((t) => t.status === "active").length;
  const totalCount = transactions.length;
  const activePct = totalCount > 0 ? (activeCount / totalCount) * 100 : 0;
  const netRecurring = activeIncome - activeExpenses;
  const recurringMarginPct =
    activeIncome > 0 ? (netRecurring / activeIncome) * 100 : 0;

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Recurring Transactions
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage automated and recurring transactions
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-all">
              <Plus className="mr-2 h-4 w-4" /> Add Recurring Transaction
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Income
            </CardTitle>
            <div className="rounded-full bg-green-500/10 p-2.5 group-hover:bg-green-500/20 transition-colors duration-300 group-hover:scale-110">
              <Repeat className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {activeIncome.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Active recurring income
            </p>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Expenses
            </CardTitle>
            <div className="rounded-full bg-red-500/10 p-2.5 group-hover:bg-red-500/20 transition-colors duration-300 group-hover:scale-110">
              <Repeat className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {activeExpenses.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Active recurring expenses
            </p>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Transactions
            </CardTitle>
            <div className="rounded-full bg-blue-500/10 p-2.5 group-hover:bg-blue-500/20 transition-colors duration-300 group-hover:scale-110">
              <Repeat className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.filter((t) => t.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {transactions.filter((t) => t.status === "paused").length} paused
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle>Recurring Transactions</CardTitle>
          <CardDescription>
            Automated transactions that repeat on a schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 mb-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recurring transactions..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {(startDate || endDate) && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                >
                  Clear Dates
                </Button>
              </div>
            )}
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
                        <span className="font-medium">
                          {transaction.description}
                        </span>
                        {transaction.client && (
                          <span className="text-xs text-muted-foreground">
                            {transaction.client}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.type === "income"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell
                      className={
                        transaction.type === "income"
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {transaction.frequency}
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.nextDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.status === "active"
                            ? "default"
                            : "secondary"
                        }
                      >
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
  );
}
