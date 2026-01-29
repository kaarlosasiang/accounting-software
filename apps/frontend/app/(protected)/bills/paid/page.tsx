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
  CheckCircle,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { billService, Bill } from "@/lib/services/bill.service";

export default function PaidBillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPaidBills();
  }, []);

  const fetchPaidBills = async () => {
    try {
      setLoading(true);
      const response = await billService.getBillsByStatus("Paid");
      if (response.success) {
        setBills(response.data);
      } else {
        toast.error(response.error || "Failed to fetch paid bills");
      }
    } catch (error) {
      toast.error("Failed to load paid bills");
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

  const totalPaid = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);

  // Calculate this month's total
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthTotal = bills
    .filter((bill) => {
      const billDate = new Date(bill.updatedAt); // Using updatedAt as paid date approximation
      return (
        billDate.getMonth() === currentMonth &&
        billDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, bill) => sum + bill.totalAmount, 0);

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
            Paid Bills
          </h1>
          <p className="text-muted-foreground">Successfully paid bills</p>
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 group-hover:text-green-500 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {bills.length} {bills.length === 1 ? "bill" : "bills"} paid
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(thisMonthTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <CardTitle>Paid Bills</CardTitle>
              <CardDescription>History of paid supplier bills</CardDescription>
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
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No paid bills found
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
                            {bill.supplierId?.supplierName || "N/A"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {bill.supplierId?.email || ""}
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
                            "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(bill.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-600 border-green-500/20"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(bill.totalAmount)}
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
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download Receipt
                            </DropdownMenuItem>
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
    </div>
  );
}
