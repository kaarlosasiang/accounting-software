"use client";

import { Clock, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

// ─── All searchable nav links ─────────────────────────────────────────────────
const NAV_LINKS = [
  // Dashboard
  { title: "Overview", url: "/dashboard", group: "Dashboard" },
  {
    title: "Financial Analytics",
    url: "/dashboard/analytics",
    group: "Dashboard",
  },
  { title: "Reports Center", url: "/dashboard/reports", group: "Dashboard" },
  // Chart of Accounts
  { title: "All Accounts", url: "/accounts", group: "Chart of Accounts" },
  { title: "Assets", url: "/accounts/assets", group: "Chart of Accounts" },
  {
    title: "Liabilities",
    url: "/accounts/liabilities",
    group: "Chart of Accounts",
  },
  { title: "Equity", url: "/accounts/equity", group: "Chart of Accounts" },
  { title: "Revenue", url: "/accounts/revenue", group: "Chart of Accounts" },
  { title: "Expenses", url: "/accounts/expenses", group: "Chart of Accounts" },
  // Sales & Receivables
  { title: "Sales Invoices", url: "/invoices", group: "Sales & Receivables" },
  {
    title: "Create Invoice",
    url: "/invoices/create",
    group: "Sales & Receivables",
  },
  { title: "Customers", url: "/customers", group: "Sales & Receivables" },
  {
    title: "A/R Aging Report",
    url: "/reports/ar-aging",
    group: "Sales & Receivables",
  },
  // Purchases & Payables
  { title: "Purchase Bills", url: "/bills", group: "Purchases & Payables" },
  { title: "Create Bill", url: "/bills/create", group: "Purchases & Payables" },
  { title: "Vendors", url: "/suppliers", group: "Purchases & Payables" },
  {
    title: "A/P Aging Report",
    url: "/reports/ap-aging",
    group: "Purchases & Payables",
  },
  // Cash Management
  { title: "All Payments", url: "/payments", group: "Cash Management" },
  {
    title: "Record Payment",
    url: "/payments/create",
    group: "Cash Management",
  },
  // General Ledger
  { title: "Ledger Entries", url: "/ledger", group: "General Ledger" },
  {
    title: "Journal Entries",
    url: "/journal-entries",
    group: "General Ledger",
  },
  {
    title: "Trial Balance",
    url: "/ledger?tab=trial-balance",
    group: "General Ledger",
  },
  // Inventory
  { title: "Items & Products", url: "/inventory", group: "Inventory" },
  {
    title: "Movement History",
    url: "/inventory/transactions",
    group: "Inventory",
  },
  // Financial Statements
  {
    title: "Profit & Loss",
    url: "/reports/profit-loss",
    group: "Financial Statements",
  },
  {
    title: "Balance Sheet",
    url: "/reports/balance-sheet",
    group: "Financial Statements",
  },
  {
    title: "Cash Flow Statement",
    url: "/reports/cash-flow",
    group: "Financial Statements",
  },
  {
    title: "Tax Summary",
    url: "/reports/tax-summary",
    group: "Financial Statements",
  },
  // Tax & Compliance
  { title: "VAT Returns", url: "/tax/vat", group: "Tax & Compliance" },
  {
    title: "Withholding Tax",
    url: "/tax/withholding",
    group: "Tax & Compliance",
  },
  { title: "BIR Forms", url: "/tax/bir-forms", group: "Tax & Compliance" },
  { title: "Tax Calendar", url: "/tax/calendar", group: "Tax & Compliance" },
  // Settings & Audit
  { title: "Settings", url: "/settings", group: "Settings" },
  { title: "Audit Logs", url: "/audit-logs", group: "Settings" },
] as const;

// ─── Groups computed once at module level (static data) ───────────────────────
const NAV_GROUPS: [string, (typeof NAV_LINKS)[number][]][] = (() => {
  const map = new Map<string, (typeof NAV_LINKS)[number][]>();
  for (const link of NAV_LINKS) {
    if (!map.has(link.group)) map.set(link.group, []);
    map.get(link.group)!.push(link);
  }
  return Array.from(map.entries());
})();

// ─── Recent links (localStorage) ─────────────────────────────────────────────
const RECENT_KEY = "sas:search:recent";
const MAX_RECENT = 5;

type RecentLink = { title: string; url: string };

function getRecent(): RecentLink[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function addRecent(link: RecentLink) {
  const prev = getRecent().filter((r) => r.url !== link.url);
  localStorage.setItem(
    RECENT_KEY,
    JSON.stringify([link, ...prev].slice(0, MAX_RECENT)),
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function SearchModal() {
  const [open, setOpen] = React.useState(false);
  const [recent, setRecent] = React.useState<RecentLink[]>([]);
  const router = useRouter();

  // Reload recent links whenever the modal opens
  React.useEffect(() => {
    if (open) setRecent(getRecent());
  }, [open]);

  // ⌘K / Ctrl+K global shortcut
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function navigate(item: RecentLink) {
    addRecent(item);
    setOpen(false);
    router.push(item.url);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 px-2 text-sm font-normal text-muted-foreground"
        onClick={() => setOpen(true)}
        aria-label="Open search"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="ml-1 hidden select-none items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
          <span>⌘</span>
          <span>K</span>
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search for pages and navigate quickly."
        className="max-w-lg"
        showCloseButton={false}
      >
        <CommandInput placeholder="Search pages..." />
        <CommandList className="max-h-[420px]">
          <CommandEmpty>No results found.</CommandEmpty>

          {recent.length > 0 && (
            <>
              <CommandGroup heading="Recent">
                {recent.map((item) => (
                  <CommandItem
                    key={`recent-${item.url}`}
                    value={`recent ${item.title}`}
                    onSelect={() => navigate(item)}
                  >
                    <Clock className="size-4 shrink-0 text-muted-foreground" />
                    <span>{item.title}</span>
                    <span className="ml-auto max-w-32 truncate text-xs text-muted-foreground">
                      {item.url}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {NAV_GROUPS.map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((item) => (
                <CommandItem
                  key={item.url}
                  value={`${item.group} ${item.title}`}
                  onSelect={() =>
                    navigate({ title: item.title, url: item.url })
                  }
                >
                  <span>{item.title}</span>
                  <span className="ml-auto max-w-32 truncate text-xs text-muted-foreground">
                    {item.url}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
