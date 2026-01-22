"use client";

import { useState, useEffect } from "react";
import { inventoryService } from "@/lib/services/inventory.service";
import { toast } from "sonner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUp,
  ArrowDown,
  Search,
  TrendingUp,
  TrendingDown,
  Download,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface InventoryTransaction {
  _id: string;
  transactionDate: string;
  inventoryItemId: {
    _id: string;
    sku: string;
    itemName: string;
    category?: string;
    unit?: string;
  };
  transactionType: "PURCHASE" | "SALE" | "ADJUSTMENT" | "TRANSFER";
  quantityIn: number;
  quantityOut: number;
  unitCost: number;
  totalValue: number;
  balanceAfter: number;
  referenceType: string;
  referenceId: string;
  notes?: string;
}

export default function InventoryTransactionsPage() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const result = await inventoryService.getAllTransactions();
        if (result.success && result.data) {
          setTransactions(result.data);
        } else {
          throw new Error(result.error || "Failed to fetch transactions");
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to fetch transactions";
        toast.error(message);
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((txn) => {
    const itemName = txn.inventoryItemId?.itemName || "";
    const itemCode = txn.inventoryItemId?.sku || "";
    const matchesSearch =
      itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.referenceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === "all" || txn.transactionType === filterType.toUpperCase();
    const matchesDateRange =
      (!startDate || new Date(txn.transactionDate) >= new Date(startDate)) &&
      (!endDate || new Date(txn.transactionDate) <= new Date(endDate));
    return matchesSearch && matchesType && matchesDateRange;
  });

  const totalTransactions = transactions.length;
  const totalIn = transactions.reduce((sum, t) => sum + t.quantityIn, 0);
  const totalOut = transactions.reduce((sum, t) => sum + t.quantityOut, 0);
  const totalValue = transactions.reduce((sum, t) => sum + t.totalValue, 0);

  const purchases = transactions.filter(
    (t) => t.transactionType === "PURCHASE",
  ).length;
  const sales = transactions.filter((t) => t.transactionType === "SALE").length;
  const inOutRatio = totalOut > 0 ? (totalIn / totalOut).toFixed(2) : "0.00";

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "PURCHASE":
      case "ADJUSTMENT":
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case "SALE":
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "default";
      case "SALE":
        return "secondary";
      case "ADJUSTMENT":
        return "outline";
      case "TRANSFER":
        return "outline";
      default:
        return "outline";
    }
  };

  const handleExportCSV = () => {
    const csv = [
      [
        "Date",
        "Item Code",
        "Item Name",
        "Type",
        "Qty In",
        "Qty Out",
        "Unit Cost",
        "Total Value",
        "Balance After",
        "Reference",
      ],
      ...filteredTransactions.map((t) => [
        t.transactionDate,
        t.inventoryItemId?.sku || "",
        t.inventoryItemId?.itemName || "",
        t.transactionType,
        t.quantityIn,
        t.quantityOut,
        t.unitCost,
        t.totalValue,
        t.balanceAfter,
        t.referenceId,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory-transactions.csv";
    a.click();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Inventory Transactions
          </h1>
          <p className="text-muted-foreground mt-2">
            Track all inventory movements and changes
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
            <div className="rounded-full bg-blue-500/10 p-2.5 group-hover:bg-blue-500/20 transition-colors duration-300 group-hover:scale-110">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalTransactions}
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>
                {purchases} purchases, {sales} sales
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantity In</CardTitle>
            <div className="rounded-full bg-green-500/10 p-2.5 group-hover:bg-green-500/20 transition-colors duration-300 group-hover:scale-110">
              <ArrowUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalIn}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
              <ArrowUp className="h-3 w-3" />
              <span>Stock received</span>
            </div>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantity Out</CardTitle>
            <div className="rounded-full bg-red-500/10 p-2.5 group-hover:bg-red-500/20 transition-colors duration-300 group-hover:scale-110">
              <ArrowDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalOut}</div>
            <div className="flex items-center gap-1 text-xs text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
              <ArrowDown className="h-3 w-3" />
              <span>{inOutRatio} in/out ratio</span>
            </div>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <div className="rounded-full bg-purple-500/10 p-2.5 group-hover:bg-purple-500/20 transition-colors duration-300 group-hover:scale-110">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalValue)}
            </div>
            <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>Transaction value</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="border border-border/50">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            All inventory movements and adjustments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
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
                  <SelectItem value="PURCHASE">Purchase</SelectItem>
                  <SelectItem value="SALE">Sale</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="w-fit"
              >
                Clear Dates
              </Button>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty In</TableHead>
                  <TableHead>Qty Out</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Balance After</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-32">
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-32">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((txn) => (
                    <TableRow key={txn._id}>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(txn.transactionDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {txn.inventoryItemId?.itemName || "N/A"}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {txn.inventoryItemId?.sku || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(txn.transactionType)}
                          <Badge
                            variant={getTransactionColor(txn.transactionType)}
                          >
                            {txn.transactionType.charAt(0) +
                              txn.transactionType.slice(1).toLowerCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {txn.quantityIn > 0 ? (
                          <span className="text-green-600 font-semibold">
                            +{txn.quantityIn}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {txn.quantityOut > 0 ? (
                          <span className="text-red-600 font-semibold">
                            -{txn.quantityOut}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(txn.unitCost)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(txn.totalValue)}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-blue-600">
                          {txn.balanceAfter}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            {txn.referenceType}
                          </span>
                          <span className="text-sm font-mono">
                            {txn.referenceId}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
