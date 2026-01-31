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
  DollarSign,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

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
import { formatCurrency } from "@/lib/utils";
import { billService, Bill } from "@/lib/services/bill.service";

export default function PendingBillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPendingBills();
  }, []);

  const fetchPendingBills = async () => {
    try {
      setLoading(true);
      const response = await billService.getAllBills();
      if (response.success) {
        // Filter for pending bills (Sent, Partial, Overdue)
        const pendingBills = response.data.filter(
          (bill) =>
            bill.status === "Sent" ||
            bill.status === "Partial" ||
            bill.status === "Overdue",
        );
        setBills(pendingBills);
      } else {
        toast.error(response.error || "Failed to fetch bills");
      }
    } catch (error) {
      toast.error("Failed to load pending bills");
      console.error("Error fetching bills:", error);
    } finally {
      setLoading(false);
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

    return matchesSearch;
  });

  const totalPending = bills.reduce((sum, bill) => sum + bill.balanceDue, 0);
  const overdueAmount = bills
    .filter((bill) => bill.status === "Overdue")
    .reduce((sum, bill) => sum + bill.balanceDue, 0);
  const openAmount = bills
    .filter((bill) => bill.status === "Sent")
    .reduce((sum, bill) => sum + bill.balanceDue, 0);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Sent: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      Partial: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      Overdue: "bg-red-500/10 text-red-600 border-red-500/20",
    };

    return (
      <Badge variant="outline" className={variants[status] || variants.Open}>
        {status}
      </Badge>
    );
  };

  const getDaysOverdue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
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
            Pending Bills
          </h1>
          <p className="text-muted-foreground">Bills awaiting payment</p>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPending)}
            </div>
            <p className="text-xs text-muted-foreground">
              {bills.length} {bills.length === 1 ? "bill" : "bills"} pending
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Bills</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600 group-hover:text-blue-500 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(openAmount)}
            </div>
              <p className="text-xs text-muted-foreground">
              {bills.filter((b) => b.status === "Sent").length} open bills
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
              {bills.filter((b) => b.status === "Overdue").length} overdue bills
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <CardTitle>Pending Bills</CardTitle>
              <CardDescription>Bills that require payment</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
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
                      colSpan={8}
                      className="text-center h-24 text-muted-foreground"
                    >
                      No pending bills found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map((bill) => {
                    const daysOverdue =
                      bill.status === "Overdue"
                        ? getDaysOverdue(bill.dueDate)
                        : 0;
                    return (
                      <TableRow
                        key={bill._id}
                        className={
                          bill.status === "Overdue"
                            ? "bg-red-50/50 dark:bg-red-950/20"
                            : ""
                        }
                      >
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
                          <div className="flex flex-col">
                            <span
                              className={
                                bill.status === "Overdue"
                                  ? "text-red-600 font-medium"
                                  : ""
                              }
                            >
                              {new Date(bill.dueDate).toLocaleDateString()}
                            </span>
                            {daysOverdue > 0 && (
                              <span className="text-xs text-red-600">
                                {daysOverdue} days overdue
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(bill.balanceDue)}
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
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Record Payment
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
