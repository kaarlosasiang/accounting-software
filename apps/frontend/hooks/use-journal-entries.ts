import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  journalEntryService,
  ledgerService,
} from "@/lib/services/journal-entry.service";
import type {
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  JournalEntryType,
  JournalEntryStatus,
} from "@/lib/types/journal-entry";
import { toast } from "sonner";

/**
 * Hook to fetch all journal entries
 */
export function useJournalEntries(params?: {
  status?: JournalEntryStatus;
  type?: JournalEntryType;
  limit?: number;
  skip?: number;
}) {
  return useQuery({
    queryKey: ["journal-entries", params],
    queryFn: () => journalEntryService.getAllJournalEntries(params),
  });
}

/**
 * Hook to fetch a single journal entry
 */
export function useJournalEntry(id: string | null) {
  return useQuery({
    queryKey: ["journal-entry", id],
    queryFn: () => journalEntryService.getJournalEntryById(id!),
    enabled: !!id,
  });
}

/**
 * Hook to fetch journal entries by date range
 */
export function useJournalEntriesByDateRange(
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: ["journal-entries", "date-range", startDate, endDate],
    queryFn: () => journalEntryService.getByDateRange(startDate!, endDate!),
    enabled: !!startDate && !!endDate,
  });
}

/**
 * Hook to create a journal entry
 */
export function useCreateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJournalEntryInput) =>
      journalEntryService.createJournalEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast.success("Journal entry created successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create journal entry",
      );
    },
  });
}

/**
 * Hook to update a journal entry
 */
export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJournalEntryInput }) =>
      journalEntryService.updateJournalEntry(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({
        queryKey: ["journal-entry", variables.id],
      });
      toast.success("Journal entry updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update journal entry",
      );
    },
  });
}

/**
 * Hook to delete a journal entry
 */
export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => journalEntryService.deleteJournalEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast.success("Journal entry deleted successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete journal entry",
      );
    },
  });
}

/**
 * Hook to post a journal entry
 */
export function usePostJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => journalEntryService.postJournalEntry(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["journal-entry", id] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      queryClient.invalidateQueries({ queryKey: ["general-ledger"] });
      toast.success("Journal entry posted successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to post journal entry",
      );
    },
  });
}

/**
 * Hook to void a journal entry
 */
export function useVoidJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => journalEntryService.voidJournalEntry(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["journal-entry", id] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      queryClient.invalidateQueries({ queryKey: ["general-ledger"] });
      toast.success("Journal entry voided successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to void journal entry",
      );
    },
  });
}

/**
 * Hook to fetch general ledger
 */
export function useGeneralLedger(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["general-ledger", startDate, endDate],
    queryFn: () => ledgerService.getGeneralLedger(startDate, endDate),
  });
}

/**
 * Hook to fetch account ledger
 */
export function useAccountLedger(
  accountId: string | null,
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: ["account-ledger", accountId, startDate, endDate],
    queryFn: () => ledgerService.getByAccount(accountId!, startDate, endDate),
    enabled: !!accountId,
  });
}

/**
 * Hook to fetch trial balance
 */
export function useTrialBalance(asOfDate?: string) {
  return useQuery({
    queryKey: ["trial-balance", asOfDate],
    queryFn: () => ledgerService.getTrialBalance(asOfDate),
  });
}
