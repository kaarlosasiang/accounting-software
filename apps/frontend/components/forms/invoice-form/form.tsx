"use client";

import { useState, useEffect } from "react";
import { useCustomers } from "@/hooks/use-customers";
import { useAccounts } from "@/hooks/use-accounts";
import { usePeriods } from "@/hooks/use-periods";
import { useOrganization } from "@/hooks/use-organization";
import { inventoryService } from "@/lib/services/inventory.service";
import type { InventoryItem } from "@/lib/types/inventory";
import {
  invoiceService,
  type InvoiceFormData,
} from "@/lib/services/invoice.service";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Check,
  ChevronsUpDown,
  AlertTriangle,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Quantity must be a positive number",
  }),
  rate: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Rate must be a positive number",
  }),
  accountId: z.string().min(1, "Account is required"),
});

const invoiceFormSchema = z
  .object({
    client: z.string().min(1, "Client is required"),
    clientEmail: z.string().email("Please enter a valid email"),
    invoiceNumber: z.string().optional(),
    issueDate: z.date({
      message: "Issue date is required",
    }),
    dueDate: z.date({
      message: "Due date is required",
    }),
    paymentTerms: z.string(),
    items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
    taxRate: z.string(),
    discount: z.string(),
    notes: z.string().optional(),
    terms: z.string().optional(),
  })
  .refine((data) => data.dueDate >= data.issueDate, {
    message: "Due date must be on or after issue date",
    path: ["dueDate"],
  });

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  onSuccess?: () => void;
}

export function InvoiceForm({ onSuccess }: InvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { customers, fetchCustomers } = useCustomers();
  const { accounts } = useAccounts("Revenue"); // Auto-fetches revenue accounts
  const { checkDateInClosedPeriod } = usePeriods();
  const { company } = useOrganization();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [inventorySheetOpen, setInventorySheetOpen] = useState<number | null>(
    null,
  );
  const [periodWarning, setPeriodWarning] = useState<{
    show: boolean;
    periodName: string;
    periodStatus: string;
    date: Date | undefined;
    callback: (() => void) | null;
  }>({
    show: false,
    periodName: "",
    periodStatus: "",
    date: undefined,
    callback: null,
  });

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Fetch inventory items
  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const result = await inventoryService.getAllItems();
        if (result.success && result.data) {
          setInventoryItems(result.data);
        }
      } catch (error) {
        console.error("Error fetching inventory items:", error);
      } finally {
        setIsLoadingInventory(false);
      }
    };
    fetchInventoryItems();
  }, []);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      client: "",
      clientEmail: "",
      invoiceNumber: "",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      paymentTerms: "net30",
      taxRate: "0",
      discount: "0",
      items: [
        {
          description: "",
          quantity: "1",
          rate: "0",
          accountId: "",
        },
      ],
      notes: "",
      terms: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleDateChange = async (
    date: Date | undefined,
    onChange: (date: Date | undefined) => void,
  ) => {
    if (!date) {
      onChange(date);
      return;
    }

    const result = await checkDateInClosedPeriod(
      date.toISOString().split("T")[0],
    );
    if (result?.isInClosedPeriod && result.period) {
      setPeriodWarning({
        show: true,
        periodName: result.period.periodName,
        periodStatus: result.period.status,
        date,
        callback: () => onChange(date),
      });
    } else {
      onChange(date);
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

  const calculateItemTotal = (quantity: string, rate: string) => {
    const q = parseFloat(quantity) || 0;
    const r = parseFloat(rate) || 0;
    return q * r;
  };

  const calculateSubtotal = () => {
    const items = form.watch("items");
    return items.reduce((sum, item) => {
      return sum + calculateItemTotal(item.quantity, item.rate);
    }, 0);
  };

  const calculateDiscount = (subtotal: number) => {
    const discount = parseFloat(form.watch("discount") || "0");
    return discount;
  };

  const calculateTax = (subtotal: number, discount: number) => {
    const taxRate = parseFloat(form.watch("taxRate") || "0");
    return (subtotal - discount) * (taxRate / 100);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount(subtotal);
    const tax = calculateTax(subtotal, discount);
    return subtotal - discount + tax;
  };

  async function submitInvoice(data: InvoiceFormValues, saveAsDraft = false) {
    setIsSubmitting(true);
    try {
      // Convert form data to API format - always create as Draft first
      const invoiceData: InvoiceFormData = {
        customerId: data.client,
        invoiceDate: data.issueDate,
        dueDate: data.dueDate,
        lineItems: data.items.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.rate),
          accountId: item.accountId,
          amount: parseFloat(item.quantity) * parseFloat(item.rate),
        })),
        taxRate: parseFloat(data.taxRate),
        discount: parseFloat(data.discount || "0"),
        notes: data.notes,
        terms: data.terms,
        status: "Draft", // Always create as draft
      };

      const response = await invoiceService.createInvoice(invoiceData);

      if (response.success) {
        // If user wants to send (not just save as draft), call sendInvoice endpoint
        if (!saveAsDraft && response.data?._id) {
          const companyName = company?.name || "Your Company";

          try {
            await invoiceService.sendInvoice(response.data._id, companyName);
            toast.success("Invoice created and sent successfully!");
          } catch (sendError) {
            toast.warning(
              "Invoice created but failed to send email. You can send it later from the invoice list.",
            );
            console.error("Failed to send invoice email:", sendError);
          }
        } else {
          toast.success("Invoice saved as draft successfully");
        }

        onSuccess?.();
      } else {
        throw new Error(response.error || "Failed to create invoice");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create invoice";
      toast.error(message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const onSubmit = (data: InvoiceFormValues) => submitInvoice(data, false);

  const handleSaveAsDraft = () => {
    form.handleSubmit((data) => submitInvoice(data, true))();
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header Section with Customer and Balance */}
          <div className="flex justify-between items-start gap-8">
            <div className="flex-1 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Auto-populate email when customer is selected
                          const selectedCustomer = customers.find(
                            (c) => c._id === value,
                          );
                          if (selectedCustomer) {
                            form.setValue(
                              "clientEmail",
                              selectedCustomer.email,
                            );
                          }
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.length === 0 ? (
                            <SelectItem value="_empty" disabled>
                              No customers found
                            </SelectItem>
                          ) : (
                            customers.map((customer) => (
                              <SelectItem
                                key={customer._id}
                                value={customer._id}
                              >
                                {customer.customerName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="billing@client.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Balance Due Display - QuickBooks Style */}
            <div className="flex flex-col items-end gap-3">
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Balance Due
                </span>
                <span className="text-4xl font-bold text-primary">
                  ₱
                  {calculateTotal().toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {form.watch("client") && (
                <div className="flex flex-col items-end gap-1 pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    Customer Balance
                  </span>
                  <span className="text-sm font-semibold">
                    ₱
                    {(
                      customers.find((c) => c._id === form.watch("client"))
                        ?.currentBalance || 0
                    ).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Invoice Details Grid - QuickBooks Style */}
          <div className="grid gap-6 md:grid-cols-4">
            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice No.</FormLabel>
                  <FormControl>
                    <Input placeholder="Auto-generated" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Invoice Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "MM/dd/yyyy")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) =>
                          handleDateChange(date, field.onChange)
                        }
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "MM/dd/yyyy")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Auto-update due date based on terms
                      const issueDate = form.getValues("issueDate");
                      if (issueDate) {
                        let daysToAdd = 30; // default
                        switch (value) {
                          case "net15":
                            daysToAdd = 15;
                            break;
                          case "net30":
                            daysToAdd = 30;
                            break;
                          case "net45":
                            daysToAdd = 45;
                            break;
                          case "net60":
                            daysToAdd = 60;
                            break;
                          case "due_on_receipt":
                            daysToAdd = 0;
                            break;
                        }
                        const newDueDate = new Date(issueDate);
                        newDueDate.setDate(newDueDate.getDate() + daysToAdd);
                        form.setValue("dueDate", newDueDate);
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="net15">Net 15</SelectItem>
                      <SelectItem value="net30">Net 30</SelectItem>
                      <SelectItem value="net45">Net 45</SelectItem>
                      <SelectItem value="net60">Net 60</SelectItem>
                      <SelectItem value="due_on_receipt">
                        Due on Receipt
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Rate</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tax rate" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">No Tax (0%)</SelectItem>
                      <SelectItem value="1">Percentage Tax (1%)</SelectItem>
                      <SelectItem value="2">Percentage Tax (2%)</SelectItem>
                      <SelectItem value="3">Percentage Tax (3%)</SelectItem>
                      <SelectItem value="12">VAT (12%)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Line Items Table - QuickBooks Style */}
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[50px_1fr_100px_120px_100px_120px_50px] gap-4 bg-muted/50 px-4 py-3 text-sm font-medium border-b">
                <div className="text-center">#</div>
                <div>DESCRIPTION</div>
                <div className="text-center">QTY</div>
                <div className="text-center">RATE</div>
                <div className="text-center">ACCOUNT</div>
                <div className="text-right">AMOUNT</div>
                <div></div>
              </div>

              {/* Table Body */}
              <div className="divide-y">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-[50px_1fr_100px_120px_100px_120px_50px] gap-4 px-4 py-4 items-start hover:bg-muted/20 transition-colors"
                  >
                    <div className="text-center text-muted-foreground pt-2">
                      {index + 1}
                    </div>

                    <div>
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  placeholder="Enter item description"
                                  className="shadow-none focus-visible:ring-1"
                                  {...field}
                                />
                              </FormControl>
                              <Sheet
                                open={inventorySheetOpen === index}
                                onOpenChange={(open) =>
                                  setInventorySheetOpen(open ? index : null)
                                }
                              >
                                <SheetTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0"
                                    title="Select from inventory"
                                  >
                                    <Package className="h-4 w-4" />
                                  </Button>
                                </SheetTrigger>
                                <SheetContent
                                  side="right"
                                  className="w-[400px] sm:w-[540px]"
                                >
                                  <SheetHeader>
                                    <SheetTitle>
                                      Select Inventory Item
                                    </SheetTitle>
                                    <SheetDescription>
                                      Choose a product or service from your
                                      inventory
                                    </SheetDescription>
                                  </SheetHeader>
                                  <div className="mt-6">
                                    <Command>
                                      <CommandInput placeholder="Search items..." />
                                      <CommandList>
                                        <CommandEmpty>
                                          {isLoadingInventory
                                            ? "Loading items..."
                                            : "No items found."}
                                        </CommandEmpty>
                                        {inventoryItems.filter(
                                          (item) => item.itemType === "Product",
                                        ).length > 0 && (
                                          <CommandGroup heading="Products">
                                            {inventoryItems
                                              .filter(
                                                (item) =>
                                                  item.itemType === "Product",
                                              )
                                              .map((item) => (
                                                <CommandItem
                                                  key={item._id}
                                                  value={item.itemName}
                                                  onSelect={() => {
                                                    // Update description
                                                    field.onChange(
                                                      item.itemName,
                                                    );
                                                    // Auto-fill rate
                                                    form.setValue(
                                                      `items.${index}.rate`,
                                                      item.sellingPrice.toString(),
                                                    );
                                                    // Set quantity to 1 if empty
                                                    const currentQty =
                                                      form.getValues(
                                                        `items.${index}.quantity`,
                                                      );
                                                    if (!currentQty) {
                                                      form.setValue(
                                                        `items.${index}.quantity`,
                                                        "1",
                                                      );
                                                    }
                                                    // Close sheet
                                                    setInventorySheetOpen(null);
                                                  }}
                                                  className="cursor-pointer"
                                                >
                                                  <Check
                                                    className={cn(
                                                      "mr-2 h-4 w-4",
                                                      item.itemName ===
                                                        field.value
                                                        ? "opacity-100"
                                                        : "opacity-0",
                                                    )}
                                                  />
                                                  <div className="flex flex-col flex-1">
                                                    <span className="font-medium">
                                                      {item.itemName}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                      SKU: {item.sku} • ₱
                                                      {item.sellingPrice.toFixed(
                                                        2,
                                                      )}
                                                    </span>
                                                  </div>
                                                </CommandItem>
                                              ))}
                                          </CommandGroup>
                                        )}
                                        {inventoryItems.filter(
                                          (item) => item.itemType === "Service",
                                        ).length > 0 && (
                                          <CommandGroup heading="Services">
                                            {inventoryItems
                                              .filter(
                                                (item) =>
                                                  item.itemType === "Service",
                                              )
                                              .map((item) => (
                                                <CommandItem
                                                  key={item._id}
                                                  value={item.itemName}
                                                  onSelect={() => {
                                                    // Update description
                                                    field.onChange(
                                                      item.itemName,
                                                    );
                                                    // Auto-fill rate
                                                    form.setValue(
                                                      `items.${index}.rate`,
                                                      item.sellingPrice.toString(),
                                                    );
                                                    // Set quantity to 1 if empty
                                                    const currentQty =
                                                      form.getValues(
                                                        `items.${index}.quantity`,
                                                      );
                                                    if (!currentQty) {
                                                      form.setValue(
                                                        `items.${index}.quantity`,
                                                        "1",
                                                      );
                                                    }
                                                    // Close sheet
                                                    setInventorySheetOpen(null);
                                                  }}
                                                  className="cursor-pointer"
                                                >
                                                  <Check
                                                    className={cn(
                                                      "mr-2 h-4 w-4",
                                                      item.itemName ===
                                                        field.value
                                                        ? "opacity-100"
                                                        : "opacity-0",
                                                    )}
                                                  />
                                                  <div className="flex flex-col flex-1">
                                                    <span className="font-medium">
                                                      {item.itemName}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                      SKU: {item.sku} • ₱
                                                      {item.sellingPrice.toFixed(
                                                        2,
                                                      )}
                                                    </span>
                                                  </div>
                                                </CommandItem>
                                              ))}
                                          </CommandGroup>
                                        )}
                                      </CommandList>
                                    </Command>
                                  </div>
                                </SheetContent>
                              </Sheet>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="1"
                                className=" shadow-none focus-visible:ring-1 text-right"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={form.control}
                        name={`items.${index}.rate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                                  ₱
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className=" shadow-none focus-visible:ring-1 text-right pl-7"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={form.control}
                        name={`items.${index}.accountId`}
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10 shadow-none focus-visible:ring-1">
                                  <SelectValue placeholder="Account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {accounts.length === 0 ? (
                                  <SelectItem value="_empty" disabled>
                                    No accounts
                                  </SelectItem>
                                ) : (
                                  accounts.map((account) => (
                                    <SelectItem
                                      key={account._id}
                                      value={account._id}
                                    >
                                      {account.accountName}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="text-right font-semibold pt-2">
                      ₱
                      {calculateItemTotal(
                        form.watch(`items.${index}.quantity`),
                        form.watch(`items.${index}.rate`),
                      ).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>

                    <div className="text-right pt-2">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Line Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  description: "",
                  quantity: "1",
                  rate: "",
                  accountId: "",
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add lines
            </Button>
          </div>

          {/* Summary - QuickBooks Style (Right Aligned) */}
          <div className="flex justify-end">
            <div className="w-96 space-y-2 text-sm">
              <div className="flex justify-between py-2">
                <span>Subtotal</span>
                <span className="font-semibold">
                  ₱
                  {calculateSubtotal().toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between py-2 items-center gap-2">
                <span>Discount</span>
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem className="mb-0">
                        <FormControl>
                          <div className="relative w-32">
                            <span className="absolute left-2 top-2 text-muted-foreground text-xs">
                              ₱
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="h-8 text-right text-sm pl-5 shadow-none focus-visible:ring-1"
                              {...field}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Tax ({form.watch("taxRate") || "0"}%)</span>
                <span className="font-semibold">
                  ₱
                  {calculateTax(
                    calculateSubtotal(),
                    calculateDiscount(calculateSubtotal()),
                  ).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold">
                <span>Total</span>
                <span>
                  ₱
                  {calculateTotal().toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold border-t-2">
                <span>Balance due</span>
                <span>
                  ₱
                  {calculateTotal().toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Messages Section */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message on invoice</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="This will show up on the invoice..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message on statement</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="This will show up on the statement..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Action Buttons - QuickBooks Style */}
          <div className="flex items-center justify-between pt-4 border-t bg-muted/20 -mx-6 -mb-6 px-6 py-4 mt-6">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => {
                form.reset();
                onSuccess?.();
              }}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={isSubmitting}
                onClick={handleSaveAsDraft}
              >
                {isSubmitting ? "Saving..." : "Save as draft"}
              </Button>
              <Button
                type="submit"
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Save and send"}
              </Button>
            </div>
          </div>
        </form>
      </Form>

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
