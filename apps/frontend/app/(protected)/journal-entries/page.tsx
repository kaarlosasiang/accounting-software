"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useJournalEntries,
  usePostJournalEntry,
  useVoidJournalEntry,
  useDeleteJournalEntry,
} from "@/hooks/use-journal-entries";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  Filter,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  JournalEntryStatus,
  JournalEntryType,
} from "@/lib/types/journal-entry";
import { format } from "date-fns";

export default function JournalEntriesPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<JournalEntryStatus | "all">(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<JournalEntryType | "all">("all");

  const { data: entries, isLoading } = useJournalEntries({
    status: statusFilter === "all" ? undefined : statusFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
  });

  const postMutation = usePostJournalEntry();
  const voidMutation = useVoidJournalEntry();
  const deleteMutation = useDeleteJournalEntry();

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

  const handlePost = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to post this journal entry? This will create ledger entries and cannot be undone.",
      )
    ) {
      await postMutation.mutateAsync(id);
    }
  };

  const handleVoid = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to void this journal entry? This will create reversing entries.",
      )
    ) {
      await voidMutation.mutateAsync(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this journal entry? This action cannot be undone.",
      )
    ) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Journal Entries
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage all journal entries
          </p>
        </div>
        <Button onClick={() => router.push("/journal-entries/create")}>
          <Plus className="mr-2 h-4 w-4" />
          New Entry
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as JournalEntryStatus | "all")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={JournalEntryStatus.DRAFT}>
                    Draft
                  </SelectItem>
                  <SelectItem value={JournalEntryStatus.POSTED}>
                    Posted
                  </SelectItem>
                  <SelectItem value={JournalEntryStatus.VOID}>Void</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select
                value={typeFilter.toString()}
                onValueChange={(value) =>
                  setTypeFilter(
                    value === "all"
                      ? "all"
                      : (parseInt(value) as JournalEntryType),
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={JournalEntryType.MANUAL.toString()}>
                    Manual
                  </SelectItem>
                  <SelectItem value={JournalEntryType.AUTO_INVOICE.toString()}>
                    Auto - Invoice
                  </SelectItem>
                  <SelectItem value={JournalEntryType.AUTO_BILL.toString()}>
                    Auto - Bill
                  </SelectItem>
                  <SelectItem value={JournalEntryType.AUTO_PAYMENT.toString()}>
                    Auto - Payment
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Journal Entries</CardTitle>
          <CardDescription>
            {entries?.length || 0} entries found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : entries && entries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Total Debit</TableHead>
                  <TableHead className="text-right">Total Credit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry._id}>
                    <TableCell className="font-medium">
                      {entry.entryNumber}
                    </TableCell>
                    <TableCell>
                      {format(new Date(entry.entryDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{getTypeBadge(entry.entryType)}</TableCell>
                    <TableCell>{entry.referenceNumber || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(entry.totalDebit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(entry.totalCredit)}
                    </TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/journal-entries/${entry._id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {entry.status === JournalEntryStatus.DRAFT && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/journal-entries/${entry._id}/edit`,
                                  )
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePost(entry._id)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Post Entry
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(entry._id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                          {entry.status === JournalEntryStatus.POSTED && (
                            <DropdownMenuItem
                              onClick={() => handleVoid(entry._id)}
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Void Entry
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">
                No journal entries found
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first journal entry to get started
              </p>
              <Button
                onClick={() => router.push("/journal-entries/create")}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Entry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
