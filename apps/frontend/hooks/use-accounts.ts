import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/config/auth-client";
import { accountsService, type Account } from "@/lib/services/accounts.service";

/**
 * Hook to fetch accounts from the API
 * Filters by account type to provide relevant selections for inventory
 */
export function useAccounts(accountType?: "Asset" | "Expense" | "Revenue") {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: activeOrganization } = authClient.useActiveOrganization();
  const activeOrgId = activeOrganization?.id;

  const fetchAccounts = useCallback(async () => {
    console.log("Active Organization:", activeOrganization);
    console.log("Active Org ID:", activeOrgId);

    if (!activeOrgId) {
      setAccounts([]);
      setError("Select an organization to view accounts");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const result = accountType
        ? await accountsService.getAccountsByType(accountType)
        : await accountsService.getAllAccounts();

      if (result.success && result.data) {
        setAccounts(result.data);
      } else {
        setAccounts([]);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch accounts");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [accountType, activeOrgId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return { accounts, loading, error, refetch: fetchAccounts };
}
