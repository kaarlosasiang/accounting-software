"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Download,
  MoreHorizontal,
  Search,
  Clock,
  Send,
  TrendingUp,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useInvoices } from "@/hooks/use-invoices";
import type { Invoice } from "@/lib/services/invoice.service";

export default function PendingInvoicesPage() {
  const {
    invoices: allInvoices,
    isLoading,
    fetchInvoicesByStatus,
  } = useInvoices();
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Fetch pending invoices on mount (Sent status)
  useEffect(() => {
    fetchInvoicesByStatus("Sent");
  }, []);

  const filteredInvoices = allInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.customerId.displayName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      invoice.customerId.customerName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const txDate = new Date(invoice.invoiceDate || invoice.createdAt);
    const withinStart = !startDate || txDate >= new Date(startDate);
    const withinEnd = !endDate || txDate <= new Date(endDate);
    return matchesSearch && withinStart && withinEnd;
  });

  const totalPending = allInvoices.reduce(
    (sum, inv) => sum + inv.balanceDue,
    0,
  );
  const avgInvoiceAmount =
    allInvoices.length > 0 ? totalPending / allInvoices.length : 0;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Pending Invoices
          </h1>
          <p className="text-muted-foreground mt-1">
            Invoices sent and awaiting payment
          </p>
        </div>
        <Link href="/invoices/create">
          <Button className="shadow-md hover:shadow-lg transition-all">
            Create Invoice
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pending
            </CardTitle>
            <div className="rounded-full bg-blue-500/10 p-2.5 group-hover:bg-blue-500/20 transition-colors duration-300 group-hover:scale-110">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPending)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span>{formatCurrency(avgInvoiceAmount)}</span>
              </div>
              <p className="text-xs text-muted-foreground">avg invoice</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {allInvoices.length} invoices
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle>Pending Invoices</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 mb-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
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
            <div className="flex justify-end gap-2">
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
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-muted-foreground">
                          Loading invoices...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No pending invoices found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + invoice.dueDate);

                    return (
                      <TableRow key={invoice._id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/invoices/${invoice._id}`}
                            className="hover:underline"
                          >
                            {invoice.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {invoice.customerId.displayName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {invoice.customerId.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {invoice.invoiceDate
                            ? new Date(invoice.invoiceDate).toLocaleDateString()
                            : new Date(invoice.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{dueDate.toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(invoice.balanceDue)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {invoice.status.toLowerCase()}
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
                              <DropdownMenuItem asChild>
                                <Link href={`/invoices/${invoice._id}`}>
                                  View Invoice
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Send className="mr-2 h-4 w-4" />
                                Send Reminder
                              </DropdownMenuItem>
                              <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
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
