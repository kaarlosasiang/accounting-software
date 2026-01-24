"use client";

import { useState, useEffect } from "react";
import { useCustomers } from "@/hooks/use-customers";
import { useAccounts } from "@/hooks/use-accounts";
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
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Check,
  ChevronsUpDown,
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
});

const invoiceFormSchema = z.object({
  client: z.string().min(1, "Client is required"),
  clientEmail: z.string().email("Please enter a valid email"),
  issueDate: z.date({
    message: "Issue date is required",
  }),
  dueDate: z.date({
    message: "Due date is required",
  }),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  onSuccess?: () => void;
}

export function InvoiceForm({ onSuccess }: InvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { customers, fetchCustomers } = useCustomers();
  const { accounts } = useAccounts("Revenue"); // Auto-fetches revenue accounts
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);

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
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      items: [{ description: "", quantity: "1", rate: "" }],
      notes: "",
      terms: "Payment is due within 30 days of invoice date.",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

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

  const calculateTax = (subtotal: number) => {
    // Assuming 8% tax rate
    return subtotal * 0.08;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax;
  };

  async function onSubmit(data: InvoiceFormValues) {
    setIsSubmitting(true);
    try {
      // Convert form data to API format
      const invoiceData: InvoiceFormData = {
        customerId: data.client,
        invoiceDate: data.issueDate,
        dueDate: data.dueDate.getTime(), // Convert to timestamp
        lineItems: data.items.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.rate),
          accountId: accounts[0]?._id || "", // Default to first revenue account
          amount: parseFloat(item.quantity) * parseFloat(item.rate),
        })),
        taxRate: 8, // 8% tax rate
        discount: 0,
        notes: data.notes,
        terms: data.terms,
        status: "Draft", // Start as draft
      };

      const response = await invoiceService.createInvoice(invoiceData);

      if (response.success) {
        toast.success("Invoice created successfully");
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

  return (
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
                          form.setValue("clientEmail", selectedCustomer.email);
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
                            <SelectItem key={customer._id} value={customer._id}>
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
        </div>

        <Separator />

        {/* Invoice Details Grid - QuickBooks Style */}
        <div className="grid gap-6 md:grid-cols-3">
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
                      onSelect={field.onChange}
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

          <FormItem>
            <FormLabel>Terms</FormLabel>
            <Select defaultValue="net30">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="net15">Net 15</SelectItem>
                <SelectItem value="net30">Net 30</SelectItem>
                <SelectItem value="net45">Net 45</SelectItem>
                <SelectItem value="net60">Net 60</SelectItem>
                <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        </div>

        {/* Line Items Table - QuickBooks Style */}
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 bg-muted/50 px-4 py-3 text-sm font-medium border-b">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">DESCRIPTION</div>
              <div className="col-span-2 text-center">QTY</div>
              <div className="col-span-2 text-center">RATE</div>
              <div className="col-span-2 text-right">AMOUNT</div>
              <div className="col-span-1"></div>
            </div>

            {/* Table Body */}
            <div className="divide-y">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-muted/20 transition-colors"
                >
                  <div className="col-span-1 text-center text-muted-foreground">
                    {index + 1}
                  </div>

                  <div className="col-span-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "justify-between  shadow-none focus:ring-1 font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value
                                    ? inventoryItems.find(
                                        (item) => item.itemName === field.value,
                                      )?.itemName
                                    : "Select item..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[400px] p-0"
                              align="start"
                            >
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
                                          (item) => item.itemType === "Product",
                                        )
                                        .map((item) => (
                                          <CommandItem
                                            key={item._id}
                                            value={item.itemName}
                                            onSelect={() => {
                                              // Update description
                                              field.onChange(item.itemName);
                                              // Auto-fill rate
                                              form.setValue(
                                                `items.${index}.rate`,
                                                item.sellingPrice.toString(),
                                              );
                                              // Set quantity to 1 if empty
                                              const currentQty = form.getValues(
                                                `items.${index}.quantity`,
                                              );
                                              if (!currentQty) {
                                                form.setValue(
                                                  `items.${index}.quantity`,
                                                  "1",
                                                );
                                              }
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                item.itemName === field.value
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />
                                            <div className="flex flex-col flex-1">
                                              <span className="font-medium">
                                                {item.itemName}
                                              </span>
                                              <span className="text-xs text-muted-foreground">
                                                ₱{item.sellingPrice.toFixed(2)}
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
                                          (item) => item.itemType === "Service",
                                        )
                                        .map((item) => (
                                          <CommandItem
                                            key={item._id}
                                            value={item.itemName}
                                            onSelect={() => {
                                              // Update description
                                              field.onChange(item.itemName);
                                              // Auto-fill rate
                                              form.setValue(
                                                `items.${index}.rate`,
                                                item.sellingPrice.toString(),
                                              );
                                              // Set quantity to 1 if empty
                                              const currentQty = form.getValues(
                                                `items.${index}.quantity`,
                                              );
                                              if (!currentQty) {
                                                form.setValue(
                                                  `items.${index}.quantity`,
                                                  "1",
                                                );
                                              }
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                item.itemName === field.value
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />
                                            <div className="flex flex-col flex-1">
                                              <span className="font-medium">
                                                {item.itemName}
                                              </span>
                                              <span className="text-xs text-muted-foreground">
                                                ₱{item.sellingPrice.toFixed(2)}
                                              </span>
                                            </div>
                                          </CommandItem>
                                        ))}
                                    </CommandGroup>
                                  )}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
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

                  <div className="col-span-2">
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

                  <div className="col-span-2 text-right font-semibold">
                    ₱
                    {calculateItemTotal(
                      form.watch(`items.${index}.quantity`),
                      form.watch(`items.${index}.rate`),
                    ).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>

                  <div className="col-span-1 text-right">
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
            onClick={() => append({ description: "", quantity: "1", rate: "" })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add lines
          </Button>
        </div>

        {/* Summary - QuickBooks Style (Right Aligned) */}
        <div className="flex justify-end">
          <div className="w-80 space-y-2 text-sm">
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
            <div className="flex justify-between py-2 border-b">
              <span>Tax (8%)</span>
              <span className="font-semibold">
                ₱
                {calculateTax(calculateSubtotal()).toLocaleString("en-PH", {
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
          <Button type="button" variant="ghost" size="lg">
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isSubmitting}
            >
              Save
            </Button>
            <Button
              type="submit"
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white shadow-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Save and send"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
