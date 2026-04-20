"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  Check,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAccounts } from "@/hooks/use-accounts";
import { useOrganization } from "@/hooks/use-organization";
import { usePeriods } from "@/hooks/use-periods";
import { useSuppliers } from "@/hooks/use-suppliers";
import { type BillFormData, billService } from "@/lib/services/bill.service";
import { inventoryService } from "@/lib/services/inventory.service";
import type { InventoryItem } from "@/lib/types/inventory";
import { cn } from "@/lib/utils";

interface BillFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const billLineItemFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  amount: z.number().min(0, "Amount must be non-negative"),
  accountId: z.string().min(1, "Account is required"),
  inventoryItemId: z.string().optional(),
  taxRate: z.number().min(0).max(100),
});

const billFormSchema = z
  .object({
    supplierId: z.string().min(1, "Supplier is required"),
    billDate: z.date({ message: "Bill date is required" }),
    dueDate: z.date({ message: "Due date is required" }),
    lineItems: z
      .array(billLineItemFormSchema)
      .min(1, "At least one line item is required"),
    taxRate: z.number().min(0).max(100),
    notes: z.string().optional(),
    status: z.enum(["Draft", "Sent", "Partial", "Paid", "Overdue", "Void"]),
    subtotal: z.number().min(0).optional(),
    totalAmount: z.number().min(0).optional(),
    balanceDue: z.number().min(0).optional(),
    amountPaid: z.number().min(0),
    discount: z.number().min(0),
  })
  .refine((data) => data.dueDate >= data.billDate, {
    message: "Due date must be on or after bill date",
    path: ["dueDate"],
  });

type BillFormValues = z.infer<typeof billFormSchema>;

const getDefaultBillValues = (): BillFormValues => ({
  supplierId: "",
  billDate: new Date(),
  dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  lineItems: [
    {
      description: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      accountId: "",
      inventoryItemId: undefined,
      taxRate: 0,
    },
  ],
  taxRate: 0,
  notes: "",
  status: "Draft",
  subtotal: 0,
  totalAmount: 0,
  balanceDue: 0,
  amountPaid: 0,
  discount: 0,
});

const getIdValue = (value?: string | { _id: string } | null) => {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : value._id;
};

const getPurchasePrice = (item: InventoryItem) => {
  return item.unitCost > 0 ? item.unitCost : item.sellingPrice;
};

export function BillForm({ onSuccess, onCancel }: BillFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState<"draft" | "approve" | null>(
    null,
  );
  const { organizationId, isPending: isOrganizationPending } =
    useOrganization();
  const { suppliers, loading: isLoadingSuppliers } = useSuppliers();
  const { accounts } = useAccounts();
  const { checkDateInClosedPeriod } = usePeriods();
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

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: getDefaultBillValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  useEffect(() => {
    const fetchInventoryItems = async () => {
      if (!organizationId) {
        setInventoryItems([]);
        setIsLoadingInventory(isOrganizationPending);
        return;
      }

      try {
        setIsLoadingInventory(true);
        const result = await inventoryService.getActiveItems();
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
  }, [organizationId, isOrganizationPending]);

  useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (
        name?.startsWith("lineItems.") &&
        (name.endsWith(".quantity") || name.endsWith(".unitPrice"))
      ) {
        const index = Number(name.split(".")[1]);
        const quantity = form.getValues(`lineItems.${index}.quantity`) || 0;
        const unitPrice = form.getValues(`lineItems.${index}.unitPrice`) || 0;
        form.setValue(`lineItems.${index}.amount`, quantity * unitPrice, {
          shouldDirty: true,
          shouldValidate: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const activeSuppliers = suppliers.filter((supplier) => supplier.isActive);
  const productInventoryItems = inventoryItems.filter(
    (item) => item.itemType === "Product",
  );
  const serviceInventoryItems = inventoryItems.filter(
    (item) => item.itemType === "Service",
  );
  const supplierStatusMessage = !organizationId
    ? "Loading organization..."
    : isLoadingSuppliers
      ? "Loading suppliers..."
      : "No active suppliers found";
  const inventoryStatusMessage = !organizationId
    ? "Loading organization..."
    : isLoadingInventory
      ? "Loading items..."
      : "No items found.";

  const billAccounts = accounts.filter(
    (account) =>
      account.accountType === "Expense" || account.accountType === "Asset",
  );

  const selectedSupplier = activeSuppliers.find(
    (supplier) => supplier._id === form.watch("supplierId"),
  );

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

  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return (quantity || 0) * (unitPrice || 0);
  };

  const calculateSubtotal = () => {
    const lineItems = form.watch("lineItems");
    return lineItems.reduce((sum, item) => {
      return sum + calculateItemTotal(item.quantity, item.unitPrice);
    }, 0);
  };

  const calculateDiscount = () => {
    return form.watch("discount") || 0;
  };

  const calculateTax = (subtotal: number, discount: number) => {
    const taxRate = form.watch("taxRate") || 0;
    return (subtotal - discount) * (taxRate / 100);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax(subtotal, discount);
    return subtotal - discount + tax;
  };

  async function submitBill(data: BillFormValues, approveAfterCreate = false) {
    setIsSubmitting(true);
    setSubmitAction(approveAfterCreate ? "approve" : "draft");

    try {
      const subtotal = data.lineItems.reduce((sum, item) => {
        return sum + calculateItemTotal(item.quantity, item.unitPrice);
      }, 0);
      const discount = data.discount || 0;
      const tax = calculateTax(subtotal, discount);
      const totalAmount = subtotal - discount + tax;

      const billData: BillFormData = {
        billDate: data.billDate,
        supplierId: data.supplierId,
        dueDate: data.dueDate,
        lineItems: data.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          accountId: item.accountId,
          inventoryItemId: item.inventoryItemId || undefined,
          amount: calculateItemTotal(item.quantity, item.unitPrice),
        })),
        taxRate: data.taxRate || 0,
        discount,
        subtotal,
        totalAmount,
        balanceDue: totalAmount,
        amountPaid: 0,
        notes: data.notes,
        status: "Draft",
      };

      const response = await billService.createBill(billData);

      if (!response.success) {
        throw new Error(response.error || "Failed to create bill");
      }

      if (approveAfterCreate && response.data?._id) {
        try {
          await billService.approveBill(response.data._id);
          toast.success("Bill created and approved successfully!");
        } catch (approvalError) {
          toast.warning(
            "Bill was created as a draft, but approval failed. You can approve it later from the bills page.",
          );
          console.error("Failed to approve bill:", approvalError);
        }
      } else {
        toast.success("Bill saved as draft successfully");
      }

      form.reset(getDefaultBillValues());
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create bill";
      toast.error(message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setSubmitAction(null);
    }
  }

  const onSubmit = (data: BillFormValues) => submitBill(data, true);

  const handleSaveAsDraft = () => {
    form.handleSubmit((data) => submitBill(data, false))();
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex justify-between items-start gap-8">
            <div className="flex-1 space-y-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeSuppliers.length === 0 ? (
                          <SelectItem value="_empty" disabled>
                            {supplierStatusMessage}
                          </SelectItem>
                        ) : (
                          activeSuppliers.map((supplier) => (
                            <SelectItem key={supplier._id} value={supplier._id}>
                              {supplier.supplierName || supplier.displayName}
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
              {selectedSupplier && (
                <div className="flex flex-col items-end gap-1 pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    Supplier Balance
                  </span>
                  <span className="text-sm font-semibold">
                    ₱
                    {(selectedSupplier.currentBalance || 0).toLocaleString(
                      "en-PH",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid gap-6 md:grid-cols-3">
            <FormField
              control={form.control}
              name="billDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Bill Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
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
                          variant="outline"
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
              name="taxRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Rate</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={String(field.value ?? 0)}
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

          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[50px_1fr_100px_130px_180px_120px_50px] gap-4 bg-muted/50 px-4 py-3 text-sm font-medium border-b">
                <div className="text-center">#</div>
                <div>DESCRIPTION</div>
                <div className="text-center">QTY</div>
                <div className="text-center">UNIT COST</div>
                <div className="text-center">ACCOUNT</div>
                <div className="text-right">AMOUNT</div>
                <div></div>
              </div>

              <div className="divide-y">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-[50px_1fr_100px_130px_180px_120px_50px] gap-4 px-4 py-4 items-start hover:bg-muted/20 transition-colors"
                  >
                    <div className="text-center text-muted-foreground pt-2">
                      {index + 1}
                    </div>

                    <div>
                      <FormField
                        control={form.control}
                        name={`lineItems.${index}.description`}
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
                                          {inventoryStatusMessage}
                                        </CommandEmpty>
                                        {productInventoryItems.length > 0 && (
                                          <CommandGroup heading="Products">
                                            {productInventoryItems.map(
                                              (item) => {
                                                const purchasePrice =
                                                  getPurchasePrice(item);

                                                return (
                                                  <CommandItem
                                                    key={item._id}
                                                    value={`${item.itemName} ${item.sku}`}
                                                    onSelect={() => {
                                                      const accountId =
                                                        getIdValue(
                                                          item.inventoryAccountId,
                                                        );
                                                      field.onChange(
                                                        item.itemName,
                                                      );
                                                      form.setValue(
                                                        `lineItems.${index}.inventoryItemId`,
                                                        item._id,
                                                      );
                                                      form.setValue(
                                                        `lineItems.${index}.unitPrice`,
                                                        purchasePrice,
                                                      );
                                                      if (accountId) {
                                                        form.setValue(
                                                          `lineItems.${index}.accountId`,
                                                          accountId,
                                                        );
                                                      }
                                                      if (
                                                        !form.getValues(
                                                          `lineItems.${index}.quantity`,
                                                        )
                                                      ) {
                                                        form.setValue(
                                                          `lineItems.${index}.quantity`,
                                                          1,
                                                        );
                                                      }
                                                      form.setValue(
                                                        `lineItems.${index}.amount`,
                                                        calculateItemTotal(
                                                          form.getValues(
                                                            `lineItems.${index}.quantity`,
                                                          ) || 1,
                                                          purchasePrice,
                                                        ),
                                                      );
                                                      setInventorySheetOpen(
                                                        null,
                                                      );
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
                                                        {`SKU: ${item.sku} • On hand: ${item.quantityOnHand} • ₱${purchasePrice.toFixed(2)}`}
                                                      </span>
                                                    </div>
                                                  </CommandItem>
                                                );
                                              },
                                            )}
                                          </CommandGroup>
                                        )}
                                        {serviceInventoryItems.length > 0 && (
                                          <CommandGroup heading="Services">
                                            {serviceInventoryItems.map(
                                              (item) => {
                                                const purchasePrice =
                                                  getPurchasePrice(item);

                                                return (
                                                  <CommandItem
                                                    key={item._id}
                                                    value={`${item.itemName} ${item.sku}`}
                                                    onSelect={() => {
                                                      const accountId =
                                                        getIdValue(
                                                          item.inventoryAccountId,
                                                        );
                                                      field.onChange(
                                                        item.itemName,
                                                      );
                                                      form.setValue(
                                                        `lineItems.${index}.inventoryItemId`,
                                                        item._id,
                                                      );
                                                      form.setValue(
                                                        `lineItems.${index}.unitPrice`,
                                                        purchasePrice,
                                                      );
                                                      if (accountId) {
                                                        form.setValue(
                                                          `lineItems.${index}.accountId`,
                                                          accountId,
                                                        );
                                                      }
                                                      if (
                                                        !form.getValues(
                                                          `lineItems.${index}.quantity`,
                                                        )
                                                      ) {
                                                        form.setValue(
                                                          `lineItems.${index}.quantity`,
                                                          1,
                                                        );
                                                      }
                                                      form.setValue(
                                                        `lineItems.${index}.amount`,
                                                        calculateItemTotal(
                                                          form.getValues(
                                                            `lineItems.${index}.quantity`,
                                                          ) || 1,
                                                          purchasePrice,
                                                        ),
                                                      );
                                                      setInventorySheetOpen(
                                                        null,
                                                      );
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
                                                        {purchasePrice.toFixed(
                                                          2,
                                                        )}
                                                      </span>
                                                    </div>
                                                  </CommandItem>
                                                );
                                              },
                                            )}
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
                        name={`lineItems.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={field.value ?? 0}
                                placeholder="1"
                                className="shadow-none focus-visible:ring-1 text-right"
                                onChange={(event) =>
                                  field.onChange(
                                    Number(event.target.value) || 0,
                                  )
                                }
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
                        name={`lineItems.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                                  ₱
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={field.value ?? 0}
                                  placeholder="0.00"
                                  className="shadow-none focus-visible:ring-1 text-right pl-7"
                                  onChange={(event) =>
                                    field.onChange(
                                      Number(event.target.value) || 0,
                                    )
                                  }
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
                        name={`lineItems.${index}.accountId`}
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10 shadow-none focus-visible:ring-1">
                                  <SelectValue placeholder="Account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {billAccounts.length === 0 ? (
                                  <SelectItem value="_empty" disabled>
                                    No accounts
                                  </SelectItem>
                                ) : (
                                  billAccounts.map((account) => (
                                    <SelectItem
                                      key={account._id}
                                      value={account._id}
                                    >
                                      {account.accountCode} -{" "}
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
                        form.watch(`lineItems.${index}.quantity`) || 0,
                        form.watch(`lineItems.${index}.unitPrice`) || 0,
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

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  description: "",
                  quantity: 1,
                  unitPrice: 0,
                  amount: 0,
                  accountId: "",
                  inventoryItemId: undefined,
                  taxRate: 0,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add lines
            </Button>
          </div>

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
                              min="0"
                              step="0.01"
                              value={field.value ?? 0}
                              placeholder="0.00"
                              className="h-8 text-right text-sm pl-5 shadow-none focus-visible:ring-1"
                              onChange={(event) =>
                                field.onChange(Number(event.target.value) || 0)
                              }
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Tax ({form.watch("taxRate") || 0}%)</span>
                <span className="font-semibold">
                  ₱
                  {calculateTax(
                    calculateSubtotal(),
                    calculateDiscount(),
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

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes about this bill..."
                    className="resize-none"
                    rows={3}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between pt-4 border-t bg-muted/20 -mx-6 -mb-6 px-6 py-4 mt-6">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => {
                form.reset(getDefaultBillValues());
                onCancel?.();
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
                {isSubmitting && submitAction === "draft"
                  ? "Saving..."
                  : "Save as draft"}
              </Button>
              <Button
                type="submit"
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting && submitAction === "approve"
                  ? "Approving..."
                  : "Create and approve"}
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
