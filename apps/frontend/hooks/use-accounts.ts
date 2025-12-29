import { useEffect, useState } from "react";

export interface Account {
  _id: string;
  accountCode: string;
  accountName: string;
  accountType: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  subType?: string;
}

/**
 * Hook to fetch accounts from the API
 * Filters by account type to provide relevant selections for inventory
 */
export function useAccounts(accountType?: "Asset" | "Expense" | "Revenue") {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API endpoint
        // For now, use placeholder data based on seeded accounts
        const mockAccounts: Account[] = [
          {
            _id: "694e85d390491da69f8bed0a",
            accountCode: "1200",
            accountName: "Inventory",
            accountType: "Asset",
            subType: "Current Asset",
          },
          {
            _id: "694e85d390491da69f8bed0c",
            accountCode: "5000",
            accountName: "Cost of Goods Sold",
            accountType: "Expense",
            subType: "Cost of Goods Sold",
          },
          {
            _id: "694e85d390491da69f8bed0e",
            accountCode: "4000",
            accountName: "Sales Revenue",
            accountType: "Revenue",
            subType: "Product Sales",
          },
        ];

        const filtered = accountType
          ? mockAccounts.filter((acc) => acc.accountType === accountType)
          : mockAccounts;

        setAccounts(filtered);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch accounts"
        );
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [accountType]);

  return { accounts, loading, error };
}
