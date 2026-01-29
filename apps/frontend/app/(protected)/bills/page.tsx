"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Plus,
  Search,
  FileText,
  Download,
  Eye,
  Edit,
  Trash,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { BillForm } from "@/components/forms";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { billService, Bill } from "@/lib/services/bill.service";

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showBillForm, setShowBillForm] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await billService.getAllBills();
      if (response.success) {
        setBills(response.data);
      } else {
        toast.error(response.error || "Failed to fetch bills");
      }
    } catch (error) {
      toast.error("Failed to load bills");
      console.error("Error fetching bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;

    try {
      const response = await billService.deleteBill(billId);
      if (response.success) {
        toast.success("Bill deleted successfully");
        fetchBills();
      } else {
        toast.error(response.message || "Failed to delete bill");
      }
    } catch (error) {
      toast.error("Failed to delete bill");
      console.error("Error deleting bill:", error);
    }
  };

  const handleVoidBill = async (billId: string) => {
    if (!confirm("Are you sure you want to void this bill?")) return;

    try {
      const response = await billService.voidBill(billId);
      if (response.success) {
        toast.success("Bill voided successfully");
        fetchBills();
      } else {
        toast.error(response.error || "Failed to void bill");
      }
    } catch (error) {
      toast.error("Failed to void bill");
      console.error("Error voiding bill:", error);
    }
  };

  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.billNumber
        ?.toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      bill.supplierId?.supplierName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      bill.supplierId?.email
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      bill._id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      bill.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totalAmount = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const paidAmount = bills
    .filter((bill) => bill.status === "Paid")
    .reduce((sum, bill) => sum + bill.totalAmount, 0);
  const pendingAmount = bills
    .filter((bill) => bill.status === "Open" || bill.status === "Partial")
    .reduce((sum, bill) => sum + bill.balanceDue, 0);
  const overdueAmount = bills
    .filter((bill) => bill.status === "Overdue")
    .reduce((sum, bill) => sum + bill.balanceDue, 0);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Draft: "bg-gray-500/10 text-gray-600 border-gray-500/20",
      Open: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      Partial: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      Paid: "bg-green-500/10 text-green-600 border-green-500/20",
      Overdue: "bg-red-500/10 text-red-600 border-red-500/20",
      Void: "bg-gray-400/10 text-gray-500 border-gray-400/20",
    };

    return (
      <Badge variant="outline" className={variants[status] || variants.Draft}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
          <Button size="sm" onClick={() => setShowBillForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Bill
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {bills.length} {bills.length === 1 ? "bill" : "bills"}
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <FileText className="h-4 w-4 text-green-600 group-hover:text-green-500 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(paidAmount)}
            </div>
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
            <div className="text-2xl font-bold">
              {formatCurrency(pendingAmount)}
            </div>
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
            <div className="text-2xl font-bold">
              {formatCurrency(overdueAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {overdueAmount > 0
                ? `${((overdueAmount / totalAmount) * 100).toFixed(1)}% overdue`
                : "No overdue bills"}
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
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Void">Void</SelectItem>
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
                {filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center h-24 text-muted-foreground"
                    >
                      No bills found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map((bill) => (
                    <TableRow key={bill._id}>
                      <TableCell className="font-medium">
                        {bill.billNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {bill.supplierId?.supplierName ||
                              bill.supplierId?.displayName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {bill.supplierId?.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-blue-500/10 text-blue-600 border-blue-500/20"
                        >
                          {bill.lineItems?.length || 0} items
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {bill.notes ||
                            bill.lineItems?.[0]?.description ||
                            "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(bill.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            bill.status === "Overdue"
                              ? "text-red-600 font-medium"
                              : ""
                          }
                        >
                          {new Date(bill.dueDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(bill.totalAmount)}
                      </TableCell>
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
                            {bill.status === "Draft" && (
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {bill.status === "Draft" ? (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteBill(bill._id)}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleVoidBill(bill._id)}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Void
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <BillForm
        open={showBillForm}
        onOpenChange={setShowBillForm}
        onSuccess={() => {
          fetchBills();
          setShowBillForm(false);
        }}
      />
    </div>
  );
}
