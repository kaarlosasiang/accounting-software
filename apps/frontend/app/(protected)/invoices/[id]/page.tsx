"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useInvoices } from "@/hooks/use-invoices";
import { useOrganization } from "@/hooks/use-organization";
import type { Invoice } from "@/lib/services/invoice.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Download,
  Send,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf/invoice-pdf";

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const {
    invoices,
    fetchInvoices,
    deleteInvoice,
    voidInvoice,
    sendInvoice,
    isLoading,
  } = useInvoices();
  const { company, addresses, contacts, taxId } = useOrganization();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (invoices.length === 0) {
      fetchInvoices();
    }
  }, [invoices.length, fetchInvoices]);

  useEffect(() => {
    if (invoices.length > 0 && invoiceId) {
      const foundInvoice = invoices.find((inv) => inv._id === invoiceId);
      if (foundInvoice) {
        setInvoice(foundInvoice);
      }
    }
  }, [invoices, invoiceId]);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      try {
        await deleteInvoice(invoiceId);
        router.push("/invoices");
      } catch (error) {
        // Error already handled by hook
      }
    }
  };

  const handleVoid = async () => {
    if (
      confirm(
        "Are you sure you want to void this invoice? This will restore inventory if applicable.",
      )
    ) {
      try {
        await voidInvoice(invoiceId);
        // Refresh the invoice data
        await fetchInvoices();
      } catch (error) {
        // Error already handled by hook
      }
    }
  };

  const handleSend = async () => {
    if (!company?.name) {
      alert("Company name is required. Please set up your company profile.");
      return;
    }

    if (confirm("Send this invoice to the customer?")) {
      try {
        await sendInvoice(invoiceId, company.name);
        // Refresh the invoice data
        await fetchInvoices();
      } catch (error) {
        // Error already handled by hook
      }
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;

    // Build company info from organization data
    const primaryAddress = addresses?.[0];
    const primaryContact = contacts?.[0];

    const companyInfo = {
      name: company?.name || "Your Company Name",
      address: primaryAddress
        ? `${primaryAddress.street || ""}, ${primaryAddress.city || ""}, ${primaryAddress.state || ""} ${primaryAddress.zipCode || ""}`
        : undefined,
      phone: primaryContact?.phone,
      email: primaryContact?.email,
      website: primaryContact?.website,
      taxId: taxId,
    };

    generateInvoicePDF(invoice, companyInfo);
  };

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

  if (isLoading || !invoice) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  const customer = invoice.customerId;
  const issueDate = invoice.invoiceDate
    ? new Date(invoice.invoiceDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date(invoice.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Invoice {invoice.invoiceNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              View invoice details and manage payments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={getStatusColor(invoice.status)}
            className="px-2.5 py-0.5 text-xs"
          >
            {invoice.status}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <Card className="border-border/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {invoice.status !== "Void" && invoice.status !== "Paid" && (
              <>
                <Button onClick={handleSend}>
                  <Send className="mr-2 h-4 w-4" />
                  Send to Customer
                </Button>
                <Button variant="outline">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Paid
                </Button>
              </>
            )}
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            {invoice.status === "Draft" && (
              <Link href={`/invoices/${invoice._id}/edit`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Invoice
                </Button>
              </Link>
            )}
            {invoice.status === "Draft" ? (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            ) : (
              invoice.status !== "Void" &&
              invoice.status !== "Paid" && (
                <Button variant="destructive" onClick={handleVoid}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Void Invoice
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Invoice Details */}
        <Card className="md:col-span-2 border-border/50">
          <CardHeader className="border-b border-border/50 bg-muted/30 py-3">
            <CardTitle className="text-base">Invoice Details</CardTitle>
            <CardDescription className="text-sm">
              Complete invoice information and line items
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 pb-4">
            {/* Invoice Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Invoice Number</span>
                </div>
                <p className="text-base font-semibold">
                  {invoice.invoiceNumber}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Issue Date</span>
                </div>
                <p className="text-base font-semibold">{issueDate}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Due Date</span>
                </div>
                <p
                  className={`text-base font-semibold ${invoice.status === "Overdue" ? "text-red-600" : ""}`}
                >
                  {dueDate}
                </p>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">
                  Status
                </div>
                <Badge
                  variant={getStatusColor(invoice.status)}
                  className="px-2.5 py-0.5 text-xs"
                >
                  {invoice.status}
                </Badge>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Line Items Table */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Line Items</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50%] text-xs">
                        Description
                      </TableHead>
                      <TableHead className="text-right text-xs">
                        Quantity
                      </TableHead>
                      <TableHead className="text-right text-xs">
                        Unit Price
                      </TableHead>
                      <TableHead className="text-right text-xs">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-sm py-2">
                          {item.description}
                        </TableCell>
                        <TableCell className="text-right text-sm py-2">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right text-sm py-2">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm py-2">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-right font-medium text-sm py-2"
                      >
                        Subtotal
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm py-2">
                        {formatCurrency(invoice.subtotal)}
                      </TableCell>
                    </TableRow>
                    {invoice.taxRate > 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-right font-medium text-sm py-2"
                        >
                          Tax ({invoice.taxRate}%)
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm py-2">
                          {formatCurrency(invoice.taxAmount)}
                        </TableCell>
                      </TableRow>
                    )}
                    {invoice.discount > 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-right font-medium text-sm py-2"
                        >
                          Discount
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600 text-sm py-2">
                          -{formatCurrency(invoice.discount)}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className="bg-muted/50">
                      <TableCell
                        colSpan={3}
                        className="text-right font-bold text-base py-2"
                      >
                        Total Amount
                      </TableCell>
                      <TableCell className="text-right font-bold text-base py-2">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                    </TableRow>
                    {invoice.amountPaid > 0 && (
                      <>
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-right font-medium text-green-600"
                          >
                            Amount Paid
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            -{formatCurrency(invoice.amountPaid)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/50">
                          <TableCell
                            colSpan={3}
                            className="text-right font-bold"
                          >
                            Balance Due
                          </TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            {formatCurrency(invoice.balanceDue)}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableFooter>
                </Table>
              </div>
            </div>

            {/* Notes and Terms */}
            {(invoice.notes || invoice.terms) && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  {invoice.notes && (
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Notes</h3>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {invoice.notes}
                      </p>
                    </div>
                  )}
                  {invoice.terms && (
                    <div>
                      <h3 className="text-sm font-semibold mb-1">
                        Terms & Conditions
                      </h3>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {invoice.terms}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Customer Info */}
          <Card className="border-border/50">
            <CardHeader className="border-b border-border/50 bg-muted/30 py-3">
              <CardTitle className="text-base">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-base mb-0.5">
                    {customer.customerName}
                  </h3>
                </div>

                {customer.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-xs font-medium">{customer.email}</p>
                    </div>
                  </div>
                )}

                {customer.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-xs font-medium">{customer.phone}</p>
                    </div>
                  </div>
                )}

                {(customer.billingAddress?.street ||
                  customer.billingAddress?.city) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Billing Address
                      </p>
                      <div className="text-xs font-medium">
                        {customer.billingAddress.street && (
                          <p>{customer.billingAddress.street}</p>
                        )}
                        {customer.billingAddress.city && (
                          <p>
                            {customer.billingAddress.city}
                            {customer.billingAddress.state &&
                              `, ${customer.billingAddress.state}`}
                            {customer.billingAddress.zipCode &&
                              ` ${customer.billingAddress.zipCode}`}
                          </p>
                        )}
                        {customer.billingAddress.country && (
                          <p>{customer.billingAddress.country}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="border-border/50">
            <CardHeader className="border-b border-border/50 bg-muted/30 py-3">
              <CardTitle className="text-base">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Total Amount
                  </span>
                  <span className="font-semibold text-sm">
                    {formatCurrency(invoice.totalAmount)}
                  </span>
                </div>
                {invoice.amountPaid > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-green-600">
                        Amount Paid
                      </span>
                      <span className="font-semibold text-green-600 text-sm">
                        {formatCurrency(invoice.amountPaid)}
                      </span>
                    </div>
                  </>
                )}
                {invoice.balanceDue > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Balance Due</span>
                      <span className="font-bold text-base text-red-600">
                        {formatCurrency(invoice.balanceDue)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline / History (placeholder for future enhancement) */}
          <Card className="border-border/50">
            <CardHeader className="border-b border-border/50 bg-muted/30 py-3">
              <CardTitle className="text-base">Invoice History</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  <div>
                    <p className="font-medium">Invoice Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(invoice.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {invoice.updatedAt !== invoice.createdAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1.5" />
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(invoice.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
