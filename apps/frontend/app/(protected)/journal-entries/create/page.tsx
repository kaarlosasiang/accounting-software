"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateJournalEntry } from "@/hooks/use-journal-entries";
import { useAccounts } from "@/hooks/use-accounts";
import { usePeriods } from "@/hooks/use-periods";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, ArrowLeft, Save, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
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

const journalLineSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  accountCode: z.string().min(1),
  accountName: z.string().min(1),
  debit: z.number().min(0),
  credit: z.number().min(0),
  description: z.string().optional(),
});

const formSchema = z
  .object({
    entryDate: z.string().min(1, "Entry date is required"),
    referenceNumber: z.string().optional(),
    description: z.string().optional(),
    lines: z.array(journalLineSchema).min(2, "At least 2 lines are required"),
  })
  .refine(
    (data) => {
      const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = data.lines.reduce(
        (sum, line) => sum + line.credit,
        0,
      );
      return Math.abs(totalDebit - totalCredit) < 0.01;
    },
    {
      message: "Total debits must equal total credits",
      path: ["lines"],
    },
  );

type FormValues = z.infer<typeof formSchema>;

interface JournalLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export default function CreateJournalEntryPage() {
  const router = useRouter();
  const { accounts } = useAccounts();
  const createMutation = useCreateJournalEntry();
  const { checkDateInClosedPeriod } = usePeriods();

  const [lines, setLines] = useState<JournalLine[]>([
    {
      accountId: "",
      accountCode: "",
      accountName: "",
      debit: 0,
      credit: 0,
      description: "",
    },
    {
      accountId: "",
      accountCode: "",
      accountName: "",
      debit: 0,
      credit: 0,
      description: "",
    },
  ]);

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entryDate: new Date().toISOString().split("T")[0],
      referenceNumber: "",
      description: "",
      lines: lines,
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

  const addLine = () => {
    const newLines = [
      ...lines,
      {
        accountId: "",
        accountCode: "",
        accountName: "",
        debit: 0,
        credit: 0,
        description: "",
      },
    ];
    setLines(newLines);
    form.setValue("lines", newLines);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) {
      toast.error("At least 2 lines are required");
      return;
    }
    const newLines = lines.filter((_, i) => i !== index);
    setLines(newLines);
    form.setValue("lines", newLines);
  };

  const updateLine = (index: number, field: keyof JournalLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // If account is selected, update account code and name
    if (field === "accountId" && value) {
      const account = accounts?.find((a) => a._id === value);
      if (account) {
        newLines[index].accountCode = account.accountCode;
        newLines[index].accountName = account.accountName;
      }
    }

    setLines(newLines);
    form.setValue("lines", newLines);
  };

  const totalDebit = lines.reduce(
    (sum, line) => sum + (Number(line.debit) || 0),
    0,
  );
  const totalCredit = lines.reduce(
    (sum, line) => sum + (Number(line.credit) || 0),
    0,
  );
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;

  const onSubmit = async (data: FormValues) => {
    if (!isBalanced) {
      toast.error("Debits must equal credits");
      return;
    }

    try {
      await createMutation.mutateAsync(data);
      router.push("/journal-entries");
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Create Journal Entry
          </h1>
          <p className="text-muted-foreground mt-1">
            Create a new manual journal entry
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle>Entry Information</CardTitle>
              <CardDescription>
                Basic information about the journal entry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="entryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Date *</FormLabel>
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

                <FormField
                  control={form.control}
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Number</FormLabel>
                      <FormControl>
                        <Input placeholder="REF-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description of the journal entry..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Journal Lines */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Journal Lines</CardTitle>
                  <CardDescription>
                    Add debit and credit entries (debits must equal credits)
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={addLine}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Line
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Account</TableHead>
                      <TableHead className="w-[200px]">Description</TableHead>
                      <TableHead className="text-right w-[120px]">
                        Debit
                      </TableHead>
                      <TableHead className="text-right w-[120px]">
                        Credit
                      </TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={line.accountId}
                            onValueChange={(value) =>
                              updateLine(index, "accountId", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts?.map((account) => (
                                <SelectItem
                                  key={account._id}
                                  value={account._id}
                                >
                                  {account.accountCode} - {account.accountName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Line description"
                            value={line.description}
                            onChange={(e) =>
                              updateLine(index, "description", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={line.debit || ""}
                            onChange={(e) =>
                              updateLine(
                                index,
                                "debit",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={line.credit || ""}
                            onChange={(e) =>
                              updateLine(
                                index,
                                "credit",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLine(index)}
                            disabled={lines.length <= 2}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totalDebit)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totalCredit)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    {/* Balance Check */}
                    <TableRow>
                      <TableCell colSpan={2}>
                        {isBalanced ? (
                          <span className="text-sm text-green-600 font-medium">
                            ✓ Entry is balanced
                          </span>
                        ) : (
                          <span className="text-sm text-destructive font-medium">
                            ✗ Out of balance by {formatCurrency(difference)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        colSpan={3}
                        className="text-right text-sm text-muted-foreground"
                      >
                        Difference: {formatCurrency(difference)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {form.formState.errors.lines && (
                <p className="text-sm text-destructive mt-2">
                  {form.formState.errors.lines.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isBalanced || createMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {createMutation.isPending ? "Saving..." : "Save as Draft"}
            </Button>
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
    </div>
  );
}
