"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useOrganization } from "@/hooks/use-organization";
import {
  MoreHorizontal,
  Plus,
  Search,
  CreditCard,
  Download,
  Eye,
  ArrowUpCircle,
  ArrowDownCircle,
  XCircle,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { paymentService } from "@/lib/services/payment.service";
import { Payment } from "@/lib/types/payment";

export default function PaymentsPage() {
  const { organizationId } = useOrganization();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  // Fetch payments data
  useEffect(() => {
    const fetchPayments = async () => {
      if (!organizationId) return;

      try {
        setLoading(true);
        setError("");

        const [receivedPayments, madePayments] = await Promise.all([
          paymentService.getReceivedPayments(),
          paymentService.getMadePayments(),
        ]);

        // Combine both arrays and sort by date (newest first)
        const allPayments = [...receivedPayments, ...madePayments].sort(
          (a, b) =>
            new Date(b.paymentDate).getTime() -
            new Date(a.paymentDate).getTime(),
        );

        setPayments(allPayments);
      } catch (err) {
        console.error("Failed to fetch payments:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load payments",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [organizationId]);

  const handleVoidClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setVoidDialogOpen(true);
  };

  const handleVoidConfirm = async () => {
    if (!selectedPayment) return;

    setIsVoiding(true);
    try {
      await paymentService.voidPayment(selectedPayment._id);

      // Refresh payments data
      const [receivedPayments, madePayments] = await Promise.all([
        paymentService.getReceivedPayments(),
        paymentService.getMadePayments(),
      ]);

      const allPayments = [...receivedPayments, ...madePayments].sort(
        (a, b) =>
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
      );

      setPayments(allPayments);

      toast.success(
        `Payment ${selectedPayment.paymentNumber} voided successfully`,
      );
      setVoidDialogOpen(false);
    } catch (error) {
      console.error("Error voiding payment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to void payment",
      );
    } finally {
      setIsVoiding(false);
      setSelectedPayment(null);
    }
  };

  const normalizePaymentType = (paymentType?: string) =>
    (paymentType || "").toUpperCase();

  const isReceivedPayment = (payment: Payment) =>
    normalizePaymentType(payment.paymentType) === "RECEIVED";

  // Helper function to get entity name and email
  const getEntityInfo = (payment: Payment) => {
    if (isReceivedPayment(payment) && payment.customer) {
      return {
        name: payment.customer.displayName || payment.customer.customerName,
        email: payment.customer.email,
      };
    }
    if (!isReceivedPayment(payment) && payment.supplier) {
      return {
        name: payment.supplier.supplierName,
        email: payment.supplier.email,
      };
    }
    return { name: "N/A", email: "" };
  };

  // Helper function to get payment description
  const getPaymentDescription = (payment: Payment) => {
    if (payment.allocations && payment.allocations.length > 0) {
      const docNumbers = payment.allocations
        .map((a) => a.documentNumber)
        .join(", ");
      const docType = isReceivedPayment(payment) ? "Invoice" : "Bill";
      return `Payment for ${docType} ${docNumbers}`;
    }
    return (
      payment.notes ||
      `${isReceivedPayment(payment) ? "Payment received" : "Payment made"}`
    );
  };

  // Helper function to get display payment method
  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case "BANK_TRANSFER":
        return "Bank Transfer";
      case "CREDIT_CARD":
        return "Credit Card";
      case "CASH":
        return "Cash";
      case "CHECK":
        return "Check";
      case "ONLINE":
        return "Online";
      default:
        return method;
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const entityInfo = getEntityInfo(payment);
    const matchesSearch =
      payment.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entityInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "Received" && isReceivedPayment(payment)) ||
      (typeFilter === "Made" && !isReceivedPayment(payment));

    return matchesSearch && matchesType;
  });

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const received = payments
    .filter((p) => isReceivedPayment(p))
    .reduce((sum, p) => sum + p.amount, 0);
  const made = payments
    .filter((p) => !isReceivedPayment(p))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Payments
          </h1>
          <p className="text-muted-foreground text-sm">
            Track all payment transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/payments/create">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payments
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPayments)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-600 group-hover:text-green-500 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(received)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.filter((p) => isReceivedPayment(p)).length} payments
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Made</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-600 group-hover:text-red-500 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(made)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.filter((p) => !isReceivedPayment(p)).length} payments
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${received - made >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(received - made)}
            </div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <CardTitle>All Payments</CardTitle>
              <CardDescription>View all payment transactions</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Made">Made</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Failed to load payments
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              {!loading && filteredPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No payments found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || typeFilter !== "all"
                      ? "No payments match your current filters."
                      : "You haven't recorded any payments yet."}
                  </p>
                  <Link href="/payments/create">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Record Your First Payment
                    </Button>
                  </Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? Array(5)
                          .fill({})
                          .map((_, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <div className="h-4 bg-muted animate-pulse rounded"></div>
                              </TableCell>
                              <TableCell>
                                <div className="h-4 bg-muted animate-pulse rounded"></div>
                              </TableCell>
                              <TableCell>
                                <div className="h-4 bg-muted animate-pulse rounded"></div>
                              </TableCell>
                              <TableCell>
                                <div className="h-4 bg-muted animate-pulse rounded"></div>
                              </TableCell>
                              <TableCell>
                                <div className="h-4 bg-muted animate-pulse rounded"></div>
                              </TableCell>
                              <TableCell>
                                <div className="h-4 bg-muted animate-pulse rounded"></div>
                              </TableCell>
                              <TableCell>
                                <div className="h-4 bg-muted animate-pulse rounded"></div>
                              </TableCell>
                              <TableCell>
                                <div className="h-4 bg-muted animate-pulse rounded"></div>
                              </TableCell>
                              <TableCell>
                                <div className="h-4 bg-muted animate-pulse rounded"></div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="h-4 w-8 bg-muted animate-pulse rounded ml-auto"></div>
                              </TableCell>
                            </TableRow>
                          ))
                      : filteredPayments.map((payment) => {
                          const entityInfo = getEntityInfo(payment);
                          return (
                            <TableRow key={payment._id}>
                              <TableCell className="font-medium">
                                {payment.paymentNumber}
                              </TableCell>
                              <TableCell>
                                {new Date(
                                  payment.paymentDate,
                                ).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    isReceivedPayment(payment)
                                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                                      : "bg-red-500/10 text-red-600 border-red-500/20"
                                  }
                                >
                                  {isReceivedPayment(payment) ? (
                                    <ArrowUpCircle className="h-3 w-3 mr-1" />
                                  ) : (
                                    <ArrowDownCircle className="h-3 w-3 mr-1" />
                                  )}
                                  {isReceivedPayment(payment)
                                    ? "Received"
                                    : "Made"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="bg-blue-500/10 text-blue-600 border-blue-500/20"
                                >
                                  Active
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {entityInfo.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {entityInfo.email}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="bg-blue-500/10 text-blue-600 border-blue-500/20"
                                >
                                  {getPaymentMethodDisplay(
                                    payment.paymentMethod,
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {payment.referenceNumber}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {getPaymentDescription(payment)}
                              </TableCell>
                              <TableCell
                                className={`font-medium ${isReceivedPayment(payment) ? "text-green-600" : "text-red-600"}`}
                              >
                                {isReceivedPayment(payment) ? "+" : "-"}
                                {formatCurrency(payment.amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                    >
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Download className="mr-2 h-4 w-4" />
                                      Download Receipt
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleVoidClick(payment)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Void Payment
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void payment{" "}
              <span className="font-semibold">
                {selectedPayment?.paymentNumber}
              </span>
              ? This action will:
              <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                <li>Reverse the journal entry for this payment</li>
                <li>
                  Restore the outstanding balance on the related invoice/bill
                </li>
                <li>Update customer/supplier account balances</li>
                <li>Mark the payment as VOIDED</li>
              </ul>
              <p className="mt-2 font-semibold text-red-600">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isVoiding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoidConfirm}
              disabled={isVoiding}
              className="bg-red-600 hover:bg-red-700"
            >
              {isVoiding ? "Voiding..." : "Void Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
