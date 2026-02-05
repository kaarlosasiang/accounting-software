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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  Download,
  MoreHorizontal,
  Plus,
  Search,
  Receipt,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { TransactionForm } from "@/components/forms/transaction-form/form";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  status: "completed" | "pending" | "failed";
  paymentMethod: string;
  client?: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "TXN-001",
    date: "2025-11-20",
    description: "Consulting Services - ABC Corp",
    category: "Professional Services",
    type: "income",
    amount: 5000.0,
    status: "completed",
    paymentMethod: "Bank Transfer",
    client: "ABC Corp",
  },
  {
    id: "TXN-002",
    date: "2025-11-19",
    description: "Office Supplies - Staples",
    category: "Office Expenses",
    type: "expense",
    amount: 324.5,
    status: "completed",
    paymentMethod: "Credit Card",
  },
  {
    id: "TXN-003",
    date: "2025-11-18",
    description: "Monthly Retainer - XYZ Inc",
    category: "Recurring Revenue",
    type: "income",
    amount: 3500.0,
    status: "completed",
    paymentMethod: "ACH",
    client: "XYZ Inc",
  },
  {
    id: "TXN-004",
    date: "2025-11-17",
    description: "Software Subscription - Adobe",
    category: "Software & Tools",
    type: "expense",
    amount: 79.99,
    status: "completed",
    paymentMethod: "Credit Card",
  },
  {
    id: "TXN-005",
    date: "2025-11-15",
    description: "Project Payment - Tech Solutions",
    category: "Project Revenue",
    type: "income",
    amount: 8750.0,
    status: "pending",
    paymentMethod: "Check",
    client: "Tech Solutions",
  },
];

export default function TransactionsPage() {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesStatus =
      filterStatus === "all" || transaction.status === filterStatus;
    const txDate = new Date(transaction.date);
    const withinStart = !startDate || txDate >= new Date(startDate);
    const withinEnd = !endDate || txDate <= new Date(endDate);
    return (
      matchesSearch && matchesType && matchesStatus && withinStart && withinEnd
    );
  });

  const totalIncome = transactions
    .filter((t) => t.type === "income" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const netIncome = totalIncome - totalExpenses;
  const pendingIncome = transactions
    .filter((t) => t.type === "income" && t.status === "pending")
    .reduce((s, t) => s + t.amount, 0);
  const incomeCompletionPct =
    totalIncome + pendingIncome > 0
      ? (totalIncome / (totalIncome + pendingIncome)) * 100
      : 0;
  const expenseSharePct =
    totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const netMarginPct = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Transactions
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage and track all your financial transactions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-all">
              <Plus className="mr-2 h-4 w-4" /> New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Transaction</DialogTitle>
              <DialogDescription>
                Add a new transaction to your accounting records
              </DialogDescription>
            </DialogHeader>
            <TransactionForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Income
            </CardTitle>
            <div className="rounded-full bg-green-500/10 p-2.5 group-hover:bg-green-500/20 transition-colors duration-300 group-hover:scale-110">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalIncome)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span>{incomeCompletionPct.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">completion</p>
            </div>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <div className="rounded-full bg-red-500/10 p-2.5 group-hover:bg-red-500/20 transition-colors duration-300 group-hover:scale-110">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full">
                <TrendingDown className="h-3 w-3" />
                <span>{expenseSharePct.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">of income</p>
            </div>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Income
            </CardTitle>
            <div className="rounded-full bg-blue-500/10 p-2.5 group-hover:bg-blue-500/20 transition-colors duration-300 group-hover:scale-110">
              <Receipt className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netIncome >= 0 ? "text-blue-600" : "text-red-600"}`}
            >
              {formatCurrency(netIncome)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs ${netIncome >=0 ? 'text-blue-600' : 'text-red-600'} bg-blue-500/10 px-2 py-0.5 rounded-full">
                <Receipt className="h-3 w-3" />
                <span>{netMarginPct.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">margin</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            View and manage all your transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 mb-4">
            <div className="grid gap-4 md:grid-cols-6">
              <div className="relative md:col-span-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID or description..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
                placeholder="Start date"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
                placeholder="End date"
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-accent/50"
              >
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                >
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
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.id}
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
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
                    <TableCell>{transaction.category}</TableCell>
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
                    <TableCell>
                      <Badge
                        variant={
                          transaction.status === "completed"
                            ? "default"
                            : transaction.status === "pending"
                              ? "outline"
                              : "destructive"
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
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Transaction</DropdownMenuItem>
                          <DropdownMenuItem>Download Receipt</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Delete Transaction
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
