"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useOrganization } from "@/hooks/use-organization";
import { useCustomers } from "@/hooks/use-customers";
import { useSuppliers } from "@/hooks/use-suppliers";
import { usePeriods } from "@/hooks/use-periods";
import { formatCurrency, parseAmount } from "@/lib/utils";
import { accountsService, type Account } from "@/lib/services/accounts.service";
import { companySettingsService } from "@/lib/services/company-settings.service";
import { invoiceService } from "@/lib/services/invoice.service";
import { billService } from "@/lib/services/bill.service";
import { paymentService } from "@/lib/services/payment.service";
import {
  AlertCircle,
  Check,
  Loader2,
  Trash2,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Payment form schema for validation
 */
const paymentFormSchema = z
  .object({
    customerId: z.string().optional(),
    supplierId: z.string().optional(),
    paymentDate: z.string().min(1, "Payment date is required"),
    paymentMethod: z.enum([
      "Cash",
      "Check",
      "Bank Transfer",
      "Credit Card",
      "Other",
    ]),
    referenceNumber: z.string().optional(),
    bankAccountId: z.string().min(1, "Bank account is required"),
    notes: z.string().optional(),
  })
  .refine((data) => data.customerId || data.supplierId, {
    message: "Customer or Supplier is required",
    path: ["customerId"],
  })
  .refine((data) => !(data.customerId && data.supplierId), {
    message: "Cannot select both Customer and Supplier",
    path: ["customerId"],
  })
  .refine(
    (data) => {
      return data.paymentMethod === "Cash" || !!data.referenceNumber?.trim();
    },
    {
      message: "Reference number is required",
      path: ["referenceNumber"],
    },
  );

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentAllocation {
  documentId: string;
  documentNumber: string;
  documentBalance: number;
  allocatedAmount: number;
  remaining: number;
}

interface SuggestedAllocation {
  documentId: string;
  documentNumber: string;
  allocatedAmount: number;
  documentBalance: number;
  remainingBalance: number;
}

export default function RecordPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organizationId } = useOrganization();
  const { customers } = useCustomers();
  const { suppliers } = useSuppliers();
  const { checkDateInClosedPeriod } = usePeriods();

  // Get URL parameters
  const invoiceId = searchParams?.get("invoiceId");
  const billId = searchParams?.get("billId");
  const amount = searchParams?.get("amount");

  const [paymentType, setPaymentType] = useState<"invoice" | "bill">("invoice");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [allocations, setAllocations] = useState<PaymentAllocation[]>([]);
  const [suggestedAllocations, setSuggestedAllocations] = useState<
    SuggestedAllocation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  const [periodWarning, setPeriodWarning] = useState<{
    show: boolean;
    periodName: string;
    periodStatus: string;
    date: string | undefined;
    callback: (() => void) | null;
  }>({
    show: false,
    periodName: "",
    periodStatus: "",
    date: undefined,
    callback: null,
  });

  // Initialize payment type and amount from URL params
  useEffect(() => {
    if (invoiceId) {
      setPaymentType("invoice");
    } else if (billId) {
      setPaymentType("bill");
    }

    if (amount) {
      setPaymentAmount(parseFloat(amount));
    }
  }, [invoiceId, billId, amount]);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      customerId: invoiceId ? "" : "",
      supplierId: billId ? "" : "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "Bank Transfer",
      referenceNumber: "",
      bankAccountId: "",
      notes: "",
    },
  });

  const handleDateChange = async (
    dateString: string,
    onChange: (dateString: string) => void,
  ) => {
    if (!dateString) {
      onChange(dateString);
      return;
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      onChange(dateString);
      return;
    }

    const result = await checkDateInClosedPeriod(dateString);
    if (result?.isInClosedPeriod && result.period) {
      setPeriodWarning({
        show: true,
        periodName: result.period.periodName,
        periodStatus: result.period.status,
        date: dateString,
        callback: () => onChange(dateString),
      });
    } else {
      onChange(dateString);
    }
  };

  const handleProceedWithWarning = () => {
    if (periodWarning.callback) {
      periodWarning.callback();
    }
    setPeriodWarning({
      show: false,
      periodName: "",
      periodStatus: "",
      date: undefined,
      callback: null,
    });
  };

  const selectedPaymentMethod = form.watch("paymentMethod");
  const selectedCustomerId = form.watch("customerId");
  const selectedSupplierId = form.watch("supplierId");

  useEffect(() => {
    if (selectedPaymentMethod === "Cash") {
      form.setValue("referenceNumber", "");
    }
  }, [selectedPaymentMethod, form]);

  // Prefill allocation for direct invoice/bill payment links
  useEffect(() => {
    const prefillFromDocument = async () => {
      if (!organizationId || allocations.length > 0) return;

      try {
        if (invoiceId) {
          const result = await invoiceService.getInvoiceById(invoiceId);
          const invoice = result?.data;
          if (!invoice) return;

          const customerValue =
            typeof invoice.customerId === "string"
              ? invoice.customerId
              : invoice.customerId?._id;

          if (customerValue) {
            form.setValue("customerId", customerValue);
            form.setValue("supplierId", "");
          }

          const allocationAmount = Math.min(
            paymentAmount,
            invoice.balanceDue ?? invoice.totalAmount ?? paymentAmount,
          );

          setAllocations([
            {
              documentId: invoice._id || invoiceId,
              documentNumber: invoice.invoiceNumber || invoiceId,
              documentBalance:
                invoice.balanceDue ?? invoice.totalAmount ?? paymentAmount,
              allocatedAmount: allocationAmount,
              remaining:
                (invoice.balanceDue ?? invoice.totalAmount ?? paymentAmount) -
                allocationAmount,
            },
          ]);
          return;
        }

        if (billId) {
          const result = await billService.getBillById(billId);
          const bill = result?.data;
          if (!bill) return;

          const supplierValue =
            typeof bill.supplierId === "string"
              ? bill.supplierId
              : bill.supplierId?._id;

          if (supplierValue) {
            form.setValue("supplierId", supplierValue);
            form.setValue("customerId", "");
          }

          const allocationAmount = Math.min(
            paymentAmount,
            bill.balanceDue ?? bill.totalAmount ?? paymentAmount,
          );

          setAllocations([
            {
              documentId: bill._id || billId,
              documentNumber: bill.billNumber || billId,
              documentBalance:
                bill.balanceDue ?? bill.totalAmount ?? paymentAmount,
              allocatedAmount: allocationAmount,
              remaining:
                (bill.balanceDue ?? bill.totalAmount ?? paymentAmount) -
                allocationAmount,
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to prefill payment allocation:", err);
      }
    };

    prefillFromDocument();
  }, [
    invoiceId,
    billId,
    organizationId,
    paymentAmount,
    form,
    allocations.length,
  ]);

  // Fetch bank/cash accounts based on payment method
  useEffect(() => {
    const fetchPaymentAccounts = async () => {
      try {
        const [accountsResult, settingsResult] = await Promise.all([
          accountsService.getAccountsByType("Asset"),
          companySettingsService.getCompanySettings(),
        ]);

        const allAssetAccounts = (accountsResult.data || []).filter(
          (account) => account.isActive !== false,
        );

        const linkedBankAccountIds = new Set(
          (settingsResult.data?.banking?.accounts || [])
            .filter((bankAccount) => bankAccount.isActive !== false)
            .map((bankAccount) => bankAccount.linkedAccountId)
            .filter((value): value is string => Boolean(value)),
        );

        const filterByKeywords = (account: Account, keywords: string[]) => {
          const text =
            `${account.subType || ""} ${account.accountName || ""}`.toLowerCase();
          return keywords.some((keyword) => text.includes(keyword));
        };

        const filteredAccounts =
          selectedPaymentMethod === "Cash"
            ? allAssetAccounts.filter((account) =>
                filterByKeywords(account, [
                  "cash",
                  "petty cash",
                  "cash on hand",
                ]),
              )
            : allAssetAccounts.filter((account) => {
                if (linkedBankAccountIds.size > 0) {
                  return linkedBankAccountIds.has(account._id);
                }
                return filterByKeywords(account, [
                  "bank",
                  "checking",
                  "savings",
                  "cash equivalent",
                ]);
              });

        const accountOptions =
          filteredAccounts.length > 0 ? filteredAccounts : allAssetAccounts;

        setBankAccounts(accountOptions);
        form.setValue("bankAccountId", "");
      } catch (err) {
        console.error("Failed to fetch payment accounts:", err);
        setBankAccounts([]);
      }
    };

    if (organizationId) {
      fetchPaymentAccounts();
    }
  }, [organizationId, selectedPaymentMethod, form]);

  /**
   * Fetch suggested allocations when customer/supplier and amount change
   */
  useEffect(() => {
    const fetchSuggestedAllocations = async () => {
      const selectedParty =
        paymentType === "invoice" ? selectedCustomerId : selectedSupplierId;

      if (!selectedParty || paymentAmount <= 0 || !organizationId) {
        setSuggestedAllocations([]);
        return;
      }

      try {
        // Only fetch suggestions for invoice payments (customer payments)
        if (paymentType === "invoice") {
          const result = await paymentService.getPaymentSuggestions(
            selectedCustomerId!,
            paymentAmount,
            organizationId!,
          );

          setSuggestedAllocations(result.data?.allocations || []);
        } else {
          // For bill payments, clear suggestions since backend doesn't support it yet
          setSuggestedAllocations([]);
        }
      } catch (err) {
        console.error("Failed to fetch suggested allocations:", err);
      }
    };

    const timer = setTimeout(fetchSuggestedAllocations, 500);
    return () => clearTimeout(timer);
  }, [
    selectedCustomerId,
    selectedSupplierId,
    paymentAmount,
    paymentType,
    organizationId,
  ]);

  /**
   * Apply suggested allocations
   */
  const applySuggestedAllocations = () => {
    if (suggestedAllocations.length === 0) return;

    const newAllocations = suggestedAllocations.map((sugg) => ({
      documentId: sugg.documentId.toString(),
      documentNumber: sugg.documentNumber,
      documentBalance: sugg.documentBalance,
      allocatedAmount: sugg.allocatedAmount,
      remaining: sugg.remainingBalance,
    }));

    setAllocations(newAllocations);
  };

  /**
   * Auto-allocate when opened from a specific invoice/bill link
   */
  useEffect(() => {
    if (allocations.length > 0 || suggestedAllocations.length === 0) return;

    const targetDocumentId = invoiceId || billId;
    if (!targetDocumentId) return;

    const targetAllocation = suggestedAllocations.find(
      (sugg) => sugg.documentId.toString() === targetDocumentId,
    );

    if (!targetAllocation) return;

    setAllocations([
      {
        documentId: targetAllocation.documentId.toString(),
        documentNumber: targetAllocation.documentNumber,
        documentBalance: targetAllocation.documentBalance,
        allocatedAmount: targetAllocation.allocatedAmount,
        remaining: targetAllocation.remainingBalance,
      },
    ]);
  }, [invoiceId, billId, suggestedAllocations, allocations.length]);

  /**
   * Add manual allocation
   */
  const addAllocation = (
    documentId: string,
    documentNumber: string,
    amount: number,
    documentBalance: number,
  ) => {
    const existing = allocations.find((a) => a.documentId === documentId);

    if (existing) {
      setError(
        `This ${paymentType === "invoice" ? "invoice" : "bill"} is already allocated`,
      );
      return;
    }

    if (amount > documentBalance) {
      setError("Allocation amount cannot exceed document balance");
      return;
    }

    const totalCurrentAllocations = allocations.reduce(
      (sum, a) => sum + a.allocatedAmount,
      0,
    );
    if (totalCurrentAllocations + amount > paymentAmount) {
      setError("Total allocations cannot exceed payment amount");
      return;
    }

    setAllocations([
      ...allocations,
      {
        documentId,
        documentNumber,
        documentBalance,
        allocatedAmount: amount,
        remaining: documentBalance - amount,
      },
    ]);
    setError("");
  };

  /**
   * Remove allocation
   */
  const removeAllocation = (documentId: string) => {
    setAllocations(allocations.filter((a) => a.documentId !== documentId));
  };

  /**
   * Handle form submission
   */
  const onSubmit = async (values: PaymentFormData) => {
    if (allocations.length === 0) {
      setError(
        `At least one ${paymentType === "invoice" ? "invoice" : "bill"} allocation is required`,
      );
      return;
    }

    const totalAllocated = allocations.reduce(
      (sum, a) => sum + a.allocatedAmount,
      0,
    );
    if (Math.abs(totalAllocated - paymentAmount) > 0.01) {
      setError("Total allocated amount must equal payment amount");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const isInvoicePayment = paymentType === "invoice";
      const payload = {
        companyId: organizationId,
        paymentDate: values.paymentDate,
        paymentMethod: values.paymentMethod,
        referenceNumber:
          values.paymentMethod === "Cash"
            ? `CASH-${Date.now()}`
            : values.referenceNumber,
        amount: paymentAmount,
        bankAccountId: values.bankAccountId,
        allocations: allocations.map((a) => ({
          documentId: a.documentId,
          documentNumber: a.documentNumber,
          allocatedAmount: a.allocatedAmount,
          documentType: isInvoicePayment ? "INVOICE" : "BILL",
        })),
        notes: values.notes,
        ...(isInvoicePayment
          ? { customerId: values.customerId }
          : { supplierId: values.supplierId }),
      };

      await (isInvoicePayment
        ? paymentService.recordPaymentReceived(payload)
        : paymentService.recordPaymentMade(payload));

      setSuccess(true);
      setTimeout(() => {
        router.push("/payments");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const totalAllocated = allocations.reduce(
    (sum, a) => sum + a.allocatedAmount,
    0,
  );
  const remainingAmount = paymentAmount - totalAllocated;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            {paymentType === "invoice"
              ? "Record Payment Received"
              : "Record Payment Made"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {paymentType === "invoice"
              ? "Record a payment from a customer and allocate it to invoices"
              : "Record a payment to a supplier and allocate it to bills"}
          </p>
        </div>

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Payment recorded successfully! Redirecting...
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Payment Details Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>
                  Enter payment information and select{" "}
                  {paymentType === "invoice" ? "invoices" : "bills"} to allocate
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Payment Type Selection - only show if no URL params */}
                {!invoiceId && !billId && (
                  <FormItem className="mb-6">
                    <FormLabel>Payment Type</FormLabel>
                    <Select
                      value={paymentType}
                      onValueChange={(value) =>
                        setPaymentType(value as "invoice" | "bill")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice">
                          Payment Received (from Customer)
                        </SelectItem>
                        <SelectItem value="bill">
                          Payment Made (to Supplier)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    {/* Customer/Supplier Selection */}
                    {paymentType === "invoice" ? (
                      <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  form.setValue("supplierId", ""); // Clear supplier when customer is selected
                                  setAllocations([]);
                                  setSuggestedAllocations([]);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a customer" />
                                </SelectTrigger>
                                <SelectContent>
                                  {customers?.map((customer: any) => (
                                    <SelectItem
                                      key={customer._id}
                                      value={customer._id}
                                    >
                                      {customer.customerName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="supplierId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supplier</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  form.setValue("customerId", ""); // Clear customer when supplier is selected
                                  setAllocations([]);
                                  setSuggestedAllocations([]);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                  {suppliers?.map((supplier: any) => (
                                    <SelectItem
                                      key={supplier._id}
                                      value={supplier._id}
                                    >
                                      {supplier.supplierName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Payment Date */}
                    <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              value={field.value}
                              onChange={(e) =>
                                handleDateChange(e.target.value, field.onChange)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Payment Amount */}
                    <FormItem>
                      <FormLabel>Payment Amount</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0.00"
                          value={paymentAmount === 0 ? "" : paymentAmount}
                          onChange={(e) => {
                            const amount = parseAmount(e.target.value);
                            setPaymentAmount(amount);
                          }}
                        />
                      </FormControl>
                      <FormDescription>Total amount being paid</FormDescription>
                    </FormItem>

                    {/* Payment Method */}
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Check">Check</SelectItem>
                                <SelectItem value="Bank Transfer">
                                  Bank Transfer
                                </SelectItem>
                                <SelectItem value="Credit Card">
                                  Credit Card
                                </SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Reference Number */}
                    {selectedPaymentMethod !== "Cash" && (
                      <FormField
                        control={form.control}
                        name="referenceNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reference Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Check #, Transaction ID, etc."
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Bank transfer ID, check number, or transaction
                              reference
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Bank/Cash Account */}
                    <FormField
                      control={form.control}
                      name="bankAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {selectedPaymentMethod === "Cash"
                              ? "Cash Account"
                              : "Deposit To Account"}
                          </FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    selectedPaymentMethod === "Cash"
                                      ? "Select cash account"
                                      : "Select bank account"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {bankAccounts?.length === 0 && (
                                  <SelectItem value="__no_accounts__" disabled>
                                    No matching accounts found
                                  </SelectItem>
                                )}
                                {bankAccounts?.map((account) => (
                                  <SelectItem
                                    key={account._id}
                                    value={account._id}
                                  >
                                    {account.accountName} ({account.accountCode}
                                    )
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            {selectedPaymentMethod === "Cash"
                              ? "Select the cash account where this payment is received"
                              : "Select the bank account where this payment is deposited"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any notes about this payment"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={loading || allocations.length === 0}
                    >
                      {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Record Payment
                    </Button>

                    {allocations.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Add or apply at least one allocation to enable
                        recording.
                      </p>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Allocations Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Allocation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Payment Amount:
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(paymentAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Allocated:</span>
                    <span
                      className={`font-semibold ${totalAllocated > paymentAmount ? "text-red-600" : ""}`}
                    >
                      {formatCurrency(totalAllocated)}
                    </span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Remaining:</span>
                    <span
                      className={
                        remainingAmount > 0
                          ? "text-amber-600"
                          : "text-green-600"
                      }
                    >
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                </div>

                {suggestedAllocations.length > 0 &&
                  allocations.length === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={applySuggestedAllocations}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Apply Suggested Allocations
                    </Button>
                  )}
              </CardContent>
            </Card>

            {/* Current Allocations */}
            {allocations.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">
                    Allocated {paymentType === "invoice" ? "Invoices" : "Bills"}{" "}
                    ({allocations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {allocations.map((alloc) => (
                      <div
                        key={alloc.documentId}
                        className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {alloc.documentNumber}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(alloc.allocatedAmount)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAllocation(alloc.documentId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Suggested Allocations Table */}
        {suggestedAllocations.length > 0 && allocations.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Suggested Allocations</CardTitle>
              <CardDescription>
                These {paymentType === "invoice" ? "invoices" : "bills"} are
                pending payment, ordered by due date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {paymentType === "invoice" ? "Invoice" : "Bill"}
                    </TableHead>
                    <TableHead className="text-right">
                      {paymentType === "invoice" ? "Invoice" : "Bill"} Balance
                    </TableHead>
                    <TableHead className="text-right">
                      Suggested Allocation
                    </TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestedAllocations.map((sugg) => (
                    <TableRow key={sugg.documentId}>
                      <TableCell className="font-medium">
                        {sugg.documentNumber}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(sugg.documentBalance)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(sugg.allocatedAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            addAllocation(
                              sugg.documentId.toString(),
                              sugg.documentNumber,
                              sugg.allocatedAmount,
                              sugg.documentBalance,
                            )
                          }
                        >
                          Allocate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog
        open={periodWarning.show}
        onOpenChange={(open) =>
          !open &&
          setPeriodWarning({
            show: false,
            periodName: "",
            periodStatus: "",
            date: undefined,
            callback: null,
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Posting to {periodWarning.periodStatus} Period
            </AlertDialogTitle>
            <AlertDialogDescription>
              The selected date falls within the accounting period{" "}
              <span className="font-semibold">{periodWarning.periodName}</span>,
              which is currently{" "}
              <span className="font-semibold">
                {periodWarning.periodStatus}
              </span>
              .
              <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                {periodWarning.periodStatus === "Closed" && (
                  <>
                    <li>This period has been closed for financial reporting</li>
                    <li>
                      Posting to this period may affect previously reported
                      financials
                    </li>
                    <li>
                      Consider using a different date or contact your accountant
                    </li>
                  </>
                )}
                {periodWarning.periodStatus === "Locked" && (
                  <>
                    <li>This period has been permanently locked</li>
                    <li>Transactions cannot be posted to locked periods</li>
                    <li>Please select a date in an open period</li>
                  </>
                )}
              </ul>
              <p className="mt-2 font-semibold text-yellow-600">
                {periodWarning.periodStatus === "Locked"
                  ? "You must select a different date."
                  : "Proceed with caution."}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Choose Different Date</AlertDialogCancel>
            {periodWarning.periodStatus !== "Locked" && (
              <AlertDialogAction
                onClick={handleProceedWithWarning}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Proceed Anyway
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
