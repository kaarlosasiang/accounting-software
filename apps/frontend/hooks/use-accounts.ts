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

        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
        const endpoint = accountType
          ? `${baseUrl}/accounts/type/${accountType}`
          : `${baseUrl}/accounts`;

        const response = await fetch(endpoint, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch accounts: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setAccounts(result.data);
        } else {
          setAccounts([]);
        }

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
