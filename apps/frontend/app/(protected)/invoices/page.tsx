"use client";

import { useState, useEffect } from "react";
import { useInvoices } from "@/hooks/use-invoices";
import { useOrganization } from "@/hooks/use-organization";
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
  Download,
  MoreHorizontal,
  Plus,
  Search,
  FileText,
  Send,
  Eye,
  Edit,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf/invoice-pdf";

export default function InvoicesPage() {
  const {
    invoices,
    isLoading,
    fetchInvoices,
    deleteInvoice,
    voidInvoice,
    sendInvoice,
  } = useInvoices();
  const { company, addresses, contacts, taxId } = useOrganization();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Fetch invoices on mount
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerId.customerName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      invoice.customerId.email
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      invoice.status.toLowerCase() === filterStatus.toLowerCase();
    const txDate = invoice.invoiceDate
      ? new Date(invoice.invoiceDate)
      : new Date(invoice.createdAt);
    const withinStart = !startDate || txDate >= new Date(startDate);
    const withinEnd = !endDate || txDate <= new Date(endDate);
    return matchesSearch && matchesStatus && withinStart && withinEnd;
  });

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidAmount = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const pendingAmount = invoices
    .filter((inv) => inv.status === "Sent" || inv.status === "Partial")
    .reduce((sum, inv) => sum + inv.balanceDue, 0);
  const overdueAmount = invoices
    .filter((inv) => inv.status === "Overdue")
    .reduce((sum, inv) => sum + inv.balanceDue, 0);
  const paidPct = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const pendingPct = totalAmount > 0 ? (pendingAmount / totalAmount) * 100 : 0;
  const overduePct = totalAmount > 0 ? (overdueAmount / totalAmount) * 100 : 0;
  const collectionRate =
    paidAmount + pendingAmount + overdueAmount > 0
      ? (paidAmount / (paidAmount + pendingAmount + overdueAmount)) * 100
      : 0;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "default";
      case "sent":
        return "outline";
      case "partial":
        return "outline";
      case "overdue":
        return "destructive";
      case "draft":
        return "secondary";
      case "void":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      try {
        await deleteInvoice(id);
      } catch (error) {
        // Error already handled by hook
      }
    }
  };

  const handleVoid = async (id: string) => {
    if (confirm("Are you sure you want to void this invoice?")) {
      try {
        await voidInvoice(id);
      } catch (error) {
        // Error already handled by hook
      }
    }
  };

  const handleSend = async (id: string) => {
    if (!company?.name) {
      alert("Company name is required. Please set up your company profile.");
      return;
    }

    if (confirm("Send this invoice to the customer?")) {
      try {
        await sendInvoice(id, company.name);
      } catch (error) {
        // Error already handled by hook
      }
    }
  };

  const handleDownloadPDF = (invoice: (typeof invoices)[0]) => {
    // Build company info from organization data
    const primaryAddress = addresses?.[0];
    const primaryContact = contacts?.[0];

    const companyInfo = {
      name: company?.name || "Your Company Name",
      address: primaryAddress
        ? `${primaryAddress.street || ""}, ${primaryAddress.city || ""}, ${
            primaryAddress.state || ""
          } ${primaryAddress.zipCode || ""}`
        : undefined,
      phone: primaryContact?.phone,
      email: primaryContact?.email,
      website: primaryContact?.website,
      taxId: taxId,
    };

    generateInvoicePDF(invoice, companyInfo);
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Invoices
          </h1>
          <p className="text-muted-foreground text-sm">
            Create, send, and manage your invoices
          </p>
        </div>
        <Link href="/invoices/create">
          <Button className="shadow-md hover:shadow-lg transition-all">
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoiced
            </CardTitle>
            <div className="rounded-full bg-purple-500/10 p-2.5 group-hover:bg-purple-500/20 transition-colors duration-300 group-hover:scale-110">
              <FileText className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalAmount)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full">
                <FileText className="h-3 w-3" />
                <span>{collectionRate.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">collection rate</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoices.length} invoices
            </p>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid
            </CardTitle>
            <div className="rounded-full bg-green-500/10 p-2.5 group-hover:bg-green-500/20 transition-colors duration-300 group-hover:scale-110">
              <FileText className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(paidAmount)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span>{paidPct.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">of total</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoices.filter((i) => i.status === "Paid").length} invoices
            </p>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <div className="rounded-full bg-blue-500/10 p-2.5 group-hover:bg-blue-500/20 transition-colors duration-300 group-hover:scale-110">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pendingAmount)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">
                <FileText className="h-3 w-3" />
                <span>{pendingPct.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">of total</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {
                invoices.filter(
                  (i) => i.status === "Sent" || i.status === "Partial",
                ).length
              }{" "}
              invoices
            </p>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
            <div className="rounded-full bg-red-500/10 p-2.5 group-hover:bg-red-500/20 transition-colors duration-300 group-hover:scale-110">
              <FileText className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overdueAmount)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full">
                <FileText className="h-3 w-3" />
                <span>{overduePct.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">of total</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoices.filter((i) => i.status === "Overdue").length} invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            Manage your invoices and track payments
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 mb-4">
            <div className="grid gap-4 md:grid-cols-6">
              <div className="relative md:col-span-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start date"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End date"
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
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
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
                    <TableCell colSpan={9} className="text-center h-32">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-32">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {invoice.customerId.customerName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {invoice.customerId.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-purple-500/10 text-purple-600 border-purple-500/20"
                        >
                          {invoice.lineItems.length}{" "}
                          {invoice.lineItems.length === 1 ? "item" : "items"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {invoice.notes ||
                            invoice.lineItems[0]?.description ||
                            "No description"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {invoice.invoiceDate
                          ? new Date(invoice.invoiceDate).toLocaleDateString()
                          : new Date(invoice.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            invoice.status === "Overdue"
                              ? "text-red-600 font-medium"
                              : ""
                          }
                        >
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invoice.status)}>
                          {invoice.status}
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
                            <Link href={`/invoices/${invoice._id}`}>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Invoice
                              </DropdownMenuItem>
                            </Link>
                            <Link href={`/invoices/${invoice._id}/edit`}>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Invoice
                              </DropdownMenuItem>
                            </Link>
                            {invoice.status !== "Void" &&
                              invoice.status !== "Paid" && (
                                <DropdownMenuItem
                                  onClick={() => handleSend(invoice._id)}
                                >
                                  <Send className="mr-2 h-4 w-4" />
                                  Send to Client
                                </DropdownMenuItem>
                              )}
                            <DropdownMenuItem
                              onClick={() => handleDownloadPDF(invoice)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {invoice.status !== "Paid" &&
                              invoice.status !== "Void" && (
                                <>
                                  <DropdownMenuItem>
                                    Mark as Paid
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                            {invoice.status === "Draft" ? (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(invoice._id)}
                              >
                                Delete Invoice
                              </DropdownMenuItem>
                            ) : (
                              invoice.status !== "Void" &&
                              invoice.status !== "Paid" && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleVoid(invoice._id)}
                                >
                                  Void Invoice
                                </DropdownMenuItem>
                              )
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
    </div>
  );
}
