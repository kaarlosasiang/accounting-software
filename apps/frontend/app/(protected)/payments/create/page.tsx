"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useOrganization } from "@/hooks/use-organization"
import { useCustomers } from "@/hooks/use-customers"
import { formatCurrency, parseAmount } from "@/lib/utils"
import { AlertCircle, Check, Loader2, Trash2, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Payment form schema for validation
 */
const paymentFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum([
    "Cash",
    "Check",
    "Bank Transfer",
    "Credit Card",
    "Other",
  ]),
  referenceNumber: z.string().min(1, "Reference number is required"),
  bankAccountId: z.string().min(1, "Bank account is required"),
  notes: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentFormSchema>

interface InvoiceAllocation {
  invoiceId: string
  documentNumber: string
  invoiceBalance: number
  allocatedAmount: number
  remaining: number
}

interface SuggestedAllocation {
  documentId: string
  documentNumber: string
  allocatedAmount: number
  invoiceBalance: number
  remainingBalance: number
}

export default function RecordPaymentPage() {
  const router = useRouter()
  const { organization } = useOrganization()
  const { customers } = useCustomers()
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [allocations, setAllocations] = useState<InvoiceAllocation[]>([])
  const [suggestedAllocations, setSuggestedAllocations] = useState<SuggestedAllocation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<any[]>([])

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      customerId: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "Bank Transfer",
      referenceNumber: "",
      bankAccountId: "",
      notes: "",
    },
  })

  // Fetch bank accounts on mount
  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const response = await fetch(`/api/v1/accounts?companyId=${organization?._id}&type=Asset&subType=Bank`)
        const data = await response.json()
        setBankAccounts(data.data || [])
      } catch (err) {
        console.error("Failed to fetch bank accounts:", err)
      }
    }

    if (organization?._id) {
      fetchBankAccounts()
    }
  }, [organization?._id])

  /**
   * Fetch suggested allocations when customer and amount change
   */
  useEffect(() => {
    const fetchSuggestedAllocations = async () => {
      if (!selectedCustomer || paymentAmount <= 0 || !organization?._id) {
        setSuggestedAllocations([])
        return
      }

      try {
        const response = await fetch("/api/v1/payments/suggest-allocations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId: organization._id,
            customerId: selectedCustomer,
            paymentAmount,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setSuggestedAllocations(data.data.allocations || [])
        }
      } catch (err) {
        console.error("Failed to fetch suggested allocations:", err)
      }
    }

    const timer = setTimeout(fetchSuggestedAllocations, 500)
    return () => clearTimeout(timer)
  }, [selectedCustomer, paymentAmount, organization?._id])

  /**
   * Apply suggested allocations
   */
  const applySuggestedAllocations = () => {
    if (suggestedAllocations.length === 0) return

    const newAllocations = suggestedAllocations.map((sugg) => ({
      invoiceId: sugg.documentId.toString(),
      documentNumber: sugg.documentNumber,
      invoiceBalance: sugg.invoiceBalance,
      allocatedAmount: sugg.allocatedAmount,
      remaining: sugg.remainingBalance,
    }))

    setAllocations(newAllocations)
  }

  /**
   * Add manual allocation
   */
  const addAllocation = (invoiceId: string, documentNumber: string, amount: number, invoiceBalance: number) => {
    const existing = allocations.find((a) => a.invoiceId === invoiceId)

    if (existing) {
      setError("This invoice is already allocated")
      return
    }

    if (amount > invoiceBalance) {
      setError("Allocation amount cannot exceed invoice balance")
      return
    }

    const totalCurrentAllocations = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0)
    if (totalCurrentAllocations + amount > paymentAmount) {
      setError("Total allocations cannot exceed payment amount")
      return
    }

    setAllocations([
      ...allocations,
      {
        invoiceId,
        documentNumber,
        invoiceBalance,
        allocatedAmount: amount,
        remaining: invoiceBalance - amount,
      },
    ])
    setError("")
  }

  /**
   * Remove allocation
   */
  const removeAllocation = (invoiceId: string) => {
    setAllocations(allocations.filter((a) => a.invoiceId !== invoiceId))
  }

  /**
   * Handle form submission
   */
  const onSubmit = async (values: PaymentFormData) => {
    if (allocations.length === 0) {
      setError("At least one invoice allocation is required")
      return
    }

    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0)
    if (Math.abs(totalAllocated - paymentAmount) > 0.01) {
      setError("Total allocated amount must equal payment amount")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/v1/payments/received", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: organization?._id,
          customerId: values.customerId,
          paymentDate: values.paymentDate,
          paymentMethod: values.paymentMethod,
          referenceNumber: values.referenceNumber,
          amount: paymentAmount,
          bankAccountId: values.bankAccountId,
          allocations: allocations.map((a) => ({
            documentId: a.invoiceId,
            documentNumber: a.documentNumber,
            allocatedAmount: a.allocatedAmount,
            documentType: "INVOICE",
          })),
          notes: values.notes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to record payment")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/payments")
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment")
    } finally {
      setLoading(false)
    }
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0)
  const remainingAmount = paymentAmount - totalAllocated

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Record Payment Received</h1>
        <p className="text-muted-foreground">
          Record a payment from a customer and allocate it to invoices
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
              <CardDescription>Enter payment information and select invoices to allocate</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Customer Selection */}
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
                              field.onChange(value)
                              setSelectedCustomer(value)
                              setAllocations([])
                              setSuggestedAllocations([])
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers?.map((customer: any) => (
                                <SelectItem key={customer._id} value={customer._id}>
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

                  {/* Payment Date */}
                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                          const amount = parseAmount(e.target.value)
                          setPaymentAmount(amount)
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
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="Check">Check</SelectItem>
                              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                              <SelectItem value="Credit Card">Credit Card</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Reference Number */}
                  <FormField
                    control={form.control}
                    name="referenceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Check #, Transaction ID, etc." {...field} />
                        </FormControl>
                        <FormDescription>Bank transfer ID, check number, or transaction reference</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Bank Account */}
                  <FormField
                    control={form.control}
                    name="bankAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit To Account</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select bank account" />
                            </SelectTrigger>
                            <SelectContent>
                              {bankAccounts?.map((account: any) => (
                                <SelectItem key={account._id} value={account._id}>
                                  {account.accountName} ({account.accountCode})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
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
                          <Textarea placeholder="Add any notes about this payment" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={loading || allocations.length === 0}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Record Payment
                  </Button>
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
                  <span className="text-muted-foreground">Payment Amount:</span>
                  <span className="font-semibold">{formatCurrency(paymentAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Allocated:</span>
                  <span className={`font-semibold ${totalAllocated > paymentAmount ? "text-red-600" : ""}`}>
                    {formatCurrency(totalAllocated)}
                  </span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Remaining:</span>
                  <span className={remainingAmount > 0 ? "text-amber-600" : "text-green-600"}>
                    {formatCurrency(remainingAmount)}
                  </span>
                </div>
              </div>

              {suggestedAllocations.length > 0 && allocations.length === 0 && (
                <Button variant="outline" size="sm" className="w-full" onClick={applySuggestedAllocations}>
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
                <CardTitle className="text-sm">Allocated Invoices ({allocations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allocations.map((alloc) => (
                    <div key={alloc.invoiceId} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                      <div className="flex-1">
                        <div className="font-medium">{alloc.documentNumber}</div>
                        <div className="text-xs text-muted-foreground">{formatCurrency(alloc.allocatedAmount)}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAllocation(alloc.invoiceId)}
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
            <CardDescription>These invoices are pending payment, ordered by due date</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Invoice Balance</TableHead>
                  <TableHead className="text-right">Suggested Allocation</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestedAllocations.map((sugg) => (
                  <TableRow key={sugg.documentId}>
                    <TableCell className="font-medium">{sugg.documentNumber}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sugg.invoiceBalance)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sugg.allocatedAmount)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          addAllocation(
                            sugg.documentId.toString(),
                            sugg.documentNumber,
                            sugg.allocatedAmount,
                            sugg.invoiceBalance,
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
  )
}
