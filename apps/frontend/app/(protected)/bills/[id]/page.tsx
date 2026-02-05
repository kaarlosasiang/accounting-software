"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBills } from "@/hooks/use-bills";
import { useOrganization } from "@/hooks/use-organization";
import type { Bill } from "@/lib/services/bill.service";
import { paymentService } from "@/lib/services/payment.service";
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
  Edit,
  Trash2,
  CheckCircle2,
  FileText,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Send,
  Building2,
  CreditCard,
  DollarSign,
  AlertCircle,
  Clock,
  Package,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BillViewPage() {
  const params = useParams();
  const router = useRouter();
  const billId = params.id as string;
  const {
    bills,
    loading,
    deleteBill,
    voidBill,
    updateBill,
    refreshBills,
    approveBill,
  } = useBills();
  const { organization } = useOrganization();

  const [bill, setBill] = useState<Bill | null>(null);

  useEffect(() => {
    if (bills.length > 0) {
      const foundBill = bills.find((b) => b._id === billId);
      if (foundBill) {
        setBill(foundBill);
      }
    }
  }, [bills, billId]);

  const handleDelete = async () => {
    if (
      bill &&
      bill.status === "Draft" &&
      confirm("Are you sure you want to delete this bill?")
    ) {
      try {
        await deleteBill(billId);
        router.push("/bills");
      } catch (error) {
        console.error("Failed to delete bill:", error);
      }
    }
  };

  const handleVoid = async () => {
    if (bill && confirm("Are you sure you want to void this bill?")) {
      try {
        await voidBill(billId);
        await refreshBills();
        setBill({ ...bill, status: "Void" });
      } catch (error) {
        console.error("Failed to void bill:", error);
      }
    }
  };

  const handleApprove = async () => {
    if (
      bill &&
      confirm(
        "Approve this bill? This will activate it and create journal entries.",
      )
    ) {
      try {
        await approveBill(billId);
        await refreshBills();
        // Update local state
        setBill({ ...bill, status: "Sent" });
      } catch (error) {
        console.error("Failed to approve bill:", error);
      }
    }
  };

  const handleEdit = () => {
    router.push(`/bills/${billId}/edit`);
  };

  const handleDownloadPDF = () => {
    if (bill) {
      // TODO: Implement bill PDF generation
      alert("PDF download coming soon!");
    }
  };

  const handleRecordPayment = () => {
    if (!bill) return;

    // Navigate to payment page with bill data pre-filled
    router.push(`/payments/create?billId=${billId}&amount=${bill.balanceDue}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "secondary";
      case "Sent":
        return "default";
      case "Partial":
        return "default";
      case "Paid":
        return "secondary";
      case "Overdue":
        return "destructive";
      case "Void":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Draft":
        return <Edit className="h-4 w-4" />;
      case "Sent":
        return <Send className="h-4 w-4" />;
      case "Partial":
        return <Clock className="h-4 w-4" />;
      case "Paid":
        return <CheckCircle2 className="h-4 w-4" />;
      case "Overdue":
        return <AlertCircle className="h-4 w-4" />;
      case "Void":
        return <Trash2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const subtotal =
    bill?.lineItems.reduce((sum, item) => sum + item.amount, 0) || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Bill not found
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/bills">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
              Bill {bill.billNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              View bill details and manage payments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={getStatusColor(bill.status)}
            className="px-2.5 py-0.5 text-xs"
          >
            {bill.status}
          </Badge>
        </div>
      </div>

      {/* Supplier Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Supplier Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold">
                {bill.supplierId.displayName || bill.supplierId.supplierName}
              </h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {bill.supplierId.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {bill.supplierId.email}
                  </div>
                )}
                {bill.supplierId.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {bill.supplierId.phone}
                  </div>
                )}
                {bill.supplierId.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {typeof bill.supplierId.address === "string"
                      ? bill.supplierId.address
                      : bill.supplierId.address?.street &&
                          bill.supplierId.address?.city
                        ? `${bill.supplierId.address.street}, ${bill.supplierId.address.city}`
                        : bill.supplierId.address || "Address available"}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Bill Number:</span>
                <span className="font-medium">{bill.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Bill Date:</span>
                <span className="font-medium">
                  {new Date(bill.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Due Date:</span>
                <span className="font-medium">
                  {new Date(bill.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge
                  variant={getStatusColor(bill.status)}
                  className="text-xs"
                >
                  {bill.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bill.lineItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Subtotal
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(subtotal)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Tax ({bill.taxRate}%)
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(bill.taxAmount)}
                </TableCell>
              </TableRow>
              {bill.discount > 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="font-medium">
                    Discount
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    -{formatCurrency(bill.discount)}
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell colSpan={3} className="font-bold text-lg">
                  Total Amount
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {formatCurrency(bill.totalAmount)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Amount Paid
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(bill.amountPaid)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="font-bold">
                  Balance Due
                </TableCell>
                <TableCell className="text-right font-bold text-blue-600">
                  {formatCurrency(bill.balanceDue)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Notes and Terms */}
      {(bill.notes || bill.terms) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bill.notes && (
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">{bill.notes}</p>
              </div>
            )}
            {bill.terms && (
              <div>
                <h4 className="font-medium mb-2">Terms</h4>
                <p className="text-sm text-muted-foreground">{bill.terms}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="border-border/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {bill.status !== "Void" && bill.status !== "Paid" && (
              <>
                {bill.status === "Draft" && (
                  <Button onClick={handleApprove}>
                    <Send className="mr-2 h-4 w-4" />
                    Approve Bill
                  </Button>
                )}
                <Button variant="outline" onClick={handleRecordPayment}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              </>
            )}
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            {bill.status === "Draft" && (
              <Link href={`/bills/${bill._id}/edit`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Bill
                </Button>
              </Link>
            )}
            {bill.status !== "Void" && bill.status !== "Paid" && (
              <Button variant="destructive" onClick={handleVoid}>
                <Trash2 className="mr-2 h-4 w-4" />
                Void Bill
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
