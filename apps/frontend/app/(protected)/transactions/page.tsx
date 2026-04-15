"use client";

import { useState, useMemo } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
import { useCurrency } from "@/hooks/use-currency";
import { useJournalEntries } from "@/hooks/use-journal-entries";
import {
  JournalEntryType,
  JournalEntryStatus,
} from "@/lib/types/journal-entry";
import { downloadCsv } from "@/lib/utils/csv-export";

const ENTRY_TYPE_LABELS: Record<number, string> = {
  [JournalEntryType.MANUAL]: "Manual",
  [JournalEntryType.AUTO_INVOICE]: "Invoice",
  [JournalEntryType.AUTO_PAYMENT]: "Payment",
  [JournalEntryType.AUTO_BILL]: "Bill Payment",
};

function getTransactionType(
  entryType: JournalEntryType,
): "income" | "expense" | "journal" {
  if (
    entryType === JournalEntryType.AUTO_INVOICE ||
    entryType === JournalEntryType.AUTO_PAYMENT
  )
    return "income";
  if (entryType === JournalEntryType.AUTO_BILL) return "expense";
  return "journal";
}

function statusVariant(
  status: JournalEntryStatus,
): "default" | "outline" | "destructive" | "secondary" {
  if (status === JournalEntryStatus.POSTED) return "default";
  if (status === JournalEntryStatus.VOID) return "destructive";
  return "outline";
}

export default function TransactionsPage() {
  const { data: entries = [], isLoading } = useJournalEntries({ limit: 200 });
  const { format } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const filteredEntries = useMemo(() => {
    return (entries ?? []).filter((entry) => {
      const desc = (entry.description ?? entry.entryNumber ?? "").toLowerCase();
      const matchesSearch =
        desc.includes(searchQuery.toLowerCase()) ||
        entry.entryNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const txType = getTransactionType(entry.entryType);
      const matchesType = filterType === "all" || filterType === txType;
      const matchesStatus =
        filterStatus === "all" || entry.status === filterStatus;
      const txDate = new Date(entry.entryDate);
      const withinStart = !startDate || txDate >= new Date(startDate);
      const withinEnd = !endDate || txDate <= new Date(endDate);
      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        withinStart &&
        withinEnd
      );
    });
  }, [entries, searchQuery, filterType, filterStatus, startDate, endDate]);

  const totalIncome = useMemo(
    () =>
      (entries ?? [])
        .filter(
          (e) =>
            getTransactionType(e.entryType) === "income" &&
            e.status === JournalEntryStatus.POSTED,
        )
        .reduce((sum, e) => sum + e.totalDebit, 0),
    [entries],
  );

  const totalExpenses = useMemo(
    () =>
      (entries ?? [])
        .filter(
          (e) =>
            getTransactionType(e.entryType) === "expense" &&
            e.status === JournalEntryStatus.POSTED,
        )
        .reduce((sum, e) => sum + e.totalDebit, 0),
    [entries],
  );

  const netIncome = totalIncome - totalExpenses;
  const expenseSharePct =
    totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const netMarginPct = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

  const handleExport = () => {
    const rows = filteredEntries.map((entry) => ({
      "Entry #": entry.entryNumber,
      Date: entry.entryDate,
      Description: entry.description ?? "",
      Type: ENTRY_TYPE_LABELS[entry.entryType] ?? "Manual",
      Amount: entry.totalDebit,
      Status: entry.status,
    }));
    downloadCsv(
      `transactions-${new Date().toISOString().split("T")[0]}.csv`,
      rows,
    );
  };

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
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{format(totalIncome)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Posted entries</p>
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
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{format(totalExpenses)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {expenseSharePct.toFixed(1)}% of income
            </p>
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
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div
                className={`text-2xl font-bold ${netIncome >= 0 ? "text-blue-600" : "text-red-600"}`}
              >
                {format(netIncome)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {netMarginPct.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            View and manage all your transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-4">
            <div className="grid gap-4 md:grid-cols-6">
              <div className="relative md:col-span-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by entry # or description..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="journal">Journal</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={JournalEntryStatus.POSTED}>
                    Posted
                  </SelectItem>
                  <SelectItem value={JournalEntryStatus.DRAFT}>
                    Draft
                  </SelectItem>
                  <SelectItem value={JournalEntryStatus.VOID}>Void</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              {(startDate || endDate) && (
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
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={filteredEntries.length === 0}
              >
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => {
                    const txType = getTransactionType(entry.entryType);
                    return (
                      <TableRow key={entry._id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {entry.entryNumber}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(entry.entryDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-60 truncate">
                          {entry.description ?? entry.entryNumber}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              txType === "income"
                                ? "default"
                                : txType === "expense"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {ENTRY_TYPE_LABELS[entry.entryType] ?? "Manual"}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={
                            txType === "income"
                              ? "text-green-600 font-semibold"
                              : txType === "expense"
                                ? "text-red-600 font-semibold"
                                : "font-semibold"
                          }
                        >
                          {txType === "income"
                            ? "+"
                            : txType === "expense"
                              ? "−"
                              : ""}
                          {format(entry.totalDebit)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(entry.status)}>
                            {entry.status}
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                Void Entry
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
