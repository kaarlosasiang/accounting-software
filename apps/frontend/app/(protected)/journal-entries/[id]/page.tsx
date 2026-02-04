"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useJournalEntry,
  usePostJournalEntry,
  useVoidJournalEntry,
  useDeleteJournalEntry,
} from "@/hooks/use-journal-entries";
import { ledgerService } from "@/lib/services/journal-entry.service";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  XCircle,
  Trash2,
  Calendar,
  FileText,
  User,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  JournalEntryStatus,
  JournalEntryType,
} from "@/lib/types/journal-entry";
import { format } from "date-fns";

export default function JournalEntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const entryId = params.id as string;

  const { data: entry, isLoading } = useJournalEntry(entryId);
  const { data: ledgerEntries } = useQuery({
    queryKey: ["ledger-entries", entryId],
    queryFn: () => ledgerService.getByJournalEntry(entryId),
    enabled: !!entry && entry.status === JournalEntryStatus.POSTED,
  });

  const postMutation = usePostJournalEntry();
  const voidMutation = useVoidJournalEntry();
  const deleteMutation = useDeleteJournalEntry();

  const handlePost = async () => {
    if (
      confirm(
        "Are you sure you want to post this journal entry? This will create ledger entries and cannot be undone.",
      )
    ) {
      await postMutation.mutateAsync(entryId);
    }
  };

  const handleVoid = async () => {
    if (
      confirm(
        "Are you sure you want to void this journal entry? This will create reversing entries.",
      )
    ) {
      await voidMutation.mutateAsync(entryId);
      router.push("/journal-entries");
    }
  };

  const handleDelete = async () => {
    if (
      confirm(
        "Are you sure you want to delete this journal entry? This action cannot be undone.",
      )
    ) {
      await deleteMutation.mutateAsync(entryId);
      router.push("/journal-entries");
    }
  };

  const getStatusBadge = (status: JournalEntryStatus) => {
    switch (status) {
      case JournalEntryStatus.DRAFT:
        return <Badge variant="outline">Draft</Badge>;
      case JournalEntryStatus.POSTED:
        return (
          <Badge variant="default" className="bg-green-600">
            Posted
          </Badge>
        );
      case JournalEntryStatus.VOID:
        return <Badge variant="destructive">Void</Badge>;
    }
  };

  const getTypeBadge = (type: JournalEntryType) => {
    switch (type) {
      case JournalEntryType.MANUAL:
        return <Badge variant="secondary">Manual</Badge>;
      case JournalEntryType.AUTO_INVOICE:
        return (
          <Badge variant="outline" className="bg-blue-50">
            Auto - Invoice
          </Badge>
        );
      case JournalEntryType.AUTO_BILL:
        return (
          <Badge variant="outline" className="bg-purple-50">
            Auto - Bill
          </Badge>
        );
      case JournalEntryType.AUTO_PAYMENT:
        return (
          <Badge variant="outline" className="bg-emerald-50">
            Auto - Payment
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-12">
        <p>Journal entry not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {entry.entryNumber}
              </h1>
              {getStatusBadge(entry.status)}
              {getTypeBadge(entry.entryType)}
            </div>
            <p className="text-muted-foreground mt-1">Journal Entry Details</p>
          </div>
        </div>

        <div className="flex gap-2">
          {entry.status === JournalEntryStatus.DRAFT && (
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/journal-entries/${entryId}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button onClick={handlePost}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Post Entry
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
          {entry.status === JournalEntryStatus.POSTED && (
            <Button variant="destructive" onClick={handleVoid}>
              <XCircle className="mr-2 h-4 w-4" />
              Void Entry
            </Button>
          )}
        </div>
      </div>

      {/* Entry Information */}
      <Card>
        <CardHeader>
          <CardTitle>Entry Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Entry Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(entry.entryDate), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Reference Number</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.referenceNumber || "—"}
                  </p>
                </div>
              </div>

              {entry.description && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Created By</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.createdBy.firstName} {entry.createdBy.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(
                      new Date(entry.createdAt),
                      "MMM d, yyyy 'at' h:mm a",
                    )}
                  </p>
                </div>
              </div>

              {entry.postedBy && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Posted By</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.postedBy.firstName} {entry.postedBy.lastName}
                    </p>
                  </div>
                </div>
              )}

              {entry.voidedBy && (
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Voided By</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.voidedBy.firstName} {entry.voidedBy.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.voidedAt &&
                        format(
                          new Date(entry.voidedAt),
                          "MMM d, yyyy 'at' h:mm a",
                        )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal Lines */}
      <Card>
        <CardHeader>
          <CardTitle>Journal Lines</CardTitle>
          <CardDescription>
            Debit and credit entries for this journal entry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.lines.map((line, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {line.accountCode}
                  </TableCell>
                  <TableCell>{line.accountName}</TableCell>
                  <TableCell>{line.description || "—"}</TableCell>
                  <TableCell className="text-right">
                    {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(entry.totalDebit)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(entry.totalCredit)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ledger Entries (if posted) */}
      {entry.status === JournalEntryStatus.POSTED &&
        ledgerEntries &&
        ledgerEntries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>General Ledger Entries</CardTitle>
              <CardDescription>
                Ledger entries created from this journal entry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.map((ledger) => (
                    <TableRow key={ledger._id}>
                      <TableCell>
                        {format(
                          new Date(ledger.transactionDate),
                          "MMM d, yyyy",
                        )}
                      </TableCell>
                      <TableCell>{ledger.accountName}</TableCell>
                      <TableCell>{ledger.description}</TableCell>
                      <TableCell className="text-right">
                        {parseFloat(ledger.debit) > 0
                          ? formatCurrency(parseFloat(ledger.debit))
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {parseFloat(ledger.credit) > 0
                          ? formatCurrency(parseFloat(ledger.credit))
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(ledger.runningBalance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
