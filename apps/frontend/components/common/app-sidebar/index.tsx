"use client";

import * as React from "react";

import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { useOrganization } from "@/hooks/use-organization";
import { usePermissions } from "@/hooks/use-permissions";
import { Resource, Action } from "@sas/validators";

// ─── Navigation item types ────────────────────────────────────────────────────
type NavPermission = { resource: Resource; action: Action };

type NavSubItem = {
  title: string;
  url: string;
  /** When set, this sub-item is hidden if the user lacks the permission */
  permission?: NavPermission;
};

type NavItem = {
  title: string;
  url: string;
  icon?: string;
  isActive?: boolean;
  /** When set, the entire section is hidden if the user lacks the permission */
  permission?: NavPermission;
  items?: NavSubItem[];
};

// Accounting navigation structure
const navData: { navMain: NavItem[] } = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: "📊",
      isActive: true,
      // No permission gate — always visible
      items: [
        { title: "Overview", url: "/dashboard" },
        { title: "Financial Analytics", url: "/dashboard/analytics" },
        { title: "Reports Center", url: "/dashboard/reports" },
      ],
    },
    {
      title: "Chart of Accounts",
      url: "/accounts",
      icon: "📑",
      permission: { resource: Resource.accounts, action: Action.read },
      items: [
        { title: "All Accounts", url: "/accounts" },
        { title: "Assets", url: "/accounts/assets" },
        { title: "Liabilities", url: "/accounts/liabilities" },
        { title: "Equity", url: "/accounts/equity" },
        { title: "Revenue", url: "/accounts/revenue" },
        { title: "Expenses", url: "/accounts/expenses" },
      ],
    },
    {
      title: "Sales & Receivables",
      url: "/invoices",
      icon: "📄",
      permission: { resource: Resource.invoice, action: Action.read },
      items: [
        { title: "Sales Invoices", url: "/invoices" },
        {
          title: "Create Invoice",
          url: "/invoices/create",
          permission: { resource: Resource.invoice, action: Action.create },
        },
        {
          title: "Customers",
          url: "/customers",
          permission: { resource: Resource.customer, action: Action.read },
        },
        {
          title: "A/R Aging Report",
          url: "/reports/ar-aging",
          permission: { resource: Resource.report, action: Action.read },
        },
      ],
    },
    {
      title: "Purchases & Payables",
      url: "/bills",
      icon: "📋",
      permission: { resource: Resource.bill, action: Action.read },
      items: [
        { title: "Purchase Bills", url: "/bills" },
        {
          title: "Create Bill",
          url: "/bills/create",
          permission: { resource: Resource.bill, action: Action.create },
        },
        {
          title: "Vendors",
          url: "/suppliers",
          permission: { resource: Resource.supplier, action: Action.read },
        },
        {
          title: "A/P Aging Report",
          url: "/reports/ap-aging",
          permission: { resource: Resource.report, action: Action.read },
        },
      ],
    },
    {
      title: "Cash Management",
      url: "/payments",
      icon: "💰",
      permission: { resource: Resource.payment, action: Action.read },
      items: [
        { title: "All Payments", url: "/payments" },
        {
          title: "Record Payment",
          url: "/payments/create",
          permission: { resource: Resource.payment, action: Action.create },
        },
      ],
    },
    {
      title: "General Ledger",
      url: "/ledger",
      icon: "📖",
      permission: { resource: Resource.ledger, action: Action.read },
      items: [
        { title: "Ledger Entries", url: "/ledger" },
        {
          title: "Journal Entries",
          url: "/journal-entries",
          permission: { resource: Resource.journalEntry, action: Action.read },
        },
        { title: "Trial Balance", url: "/ledger?tab=trial-balance" },
      ],
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: "📦",
      permission: { resource: Resource.inventory, action: Action.read },
      items: [
        { title: "Items & Products", url: "/inventory" },
        { title: "Movement History", url: "/inventory/transactions" },
      ],
    },
    {
      title: "Financial Statements",
      url: "/reports",
      icon: "📈",
      permission: { resource: Resource.report, action: Action.read },
      items: [
        { title: "Profit & Loss", url: "/reports/profit-loss" },
        { title: "Balance Sheet", url: "/reports/balance-sheet" },
        { title: "Cash Flow Statement", url: "/reports/cash-flow" },
        { title: "Tax Summary", url: "/reports/tax-summary" },
      ],
    },
    {
      title: "Tax & Compliance",
      url: "/tax",
      icon: "🧾",
      // No permission gate — always visible
      items: [
        { title: "VAT Returns", url: "/tax/vat" },
        { title: "Withholding Tax", url: "/tax/withholding" },
        { title: "BIR Forms", url: "/tax/bir-forms" },
        { title: "Tax Calendar", url: "/tax/calendar" },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: "⚙️",
      permission: { resource: Resource.companySetting, action: Action.read },
      // No sub-items — settings has its own dedicated layout with sidebar
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user: authUser } = useAuth();
  const { organizationName } = useOrganization();
  const { can } = usePermissions();

  // Filter nav items based on the current user's effective permissions.
  // `can()` returns true while permissions are still loading (optimistic),
  // so items won't flicker in/out on initial render.
  const filteredNavMain = navData.navMain
    .filter(
      (item) =>
        !item.permission ||
        can(item.permission.resource, item.permission.action),
    )
    .map((item) => ({
      ...item,
      items: item.items?.filter(
        (sub) =>
          !sub.permission ||
          can(sub.permission.resource, sub.permission.action),
      ),
    }));

  console.log("Active Organization Name:", organizationName);

  const displayName =
    (authUser?.first_name && authUser?.last_name
      ? `${authUser.first_name} ${authUser.last_name}`
      : authUser?.name) ||
    (authUser?.email ? authUser.email.split("@")[0] : "User");
  const displayEmail = organizationName || authUser?.email || "";
  const displayAvatar = (authUser as any)?.image ?? "/avatars/user.jpg";

  const sidebarUser = {
    name: displayName,
    email: displayEmail,
    avatar: displayAvatar,
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex relative mt-2">
            <div className="flex aspect-square items-center justify-center rounded-lg">
              <Image
                src={"/am-fintrass-icon.png"}
                alt={"AM FINTRASS Icon"}
                width={32}
                height={32}
              />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight absolute left-10">
              <span className="truncate font-bold">
                <span className="text-primary">AM</span> FINTRASS
              </span>
              <span className="truncate text-xs">Smart Accounting System</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        {/* <NavProjects projects={[]} /> */}
      </SidebarContent>
      <SidebarFooter>
        <Card className="relative group overflow-hidden border-none  text-primary-foreground p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          {/* Animated mesh gradient background */}
          <div className="absolute inset-0 opacity-60">
            <div className="absolute top-0 -left-4 w-24 h-24 bg-linear-to-br from-blue-400/30 to-transparent rounded-full blur-2xl group-hover:scale-125 group-hover:opacity-100 transition-all duration-700" />
            <div className="absolute top-1/3 -right-4 w-32 h-32 bg-linear-to-bl from-purple-400/25 to-transparent rounded-full blur-3xl group-hover:scale-110 group-hover:opacity-100 transition-all duration-500" />
            <div className="absolute -bottom-4 left-1/4 w-28 h-28 bg-linear-to-tr from-pink-400/20 to-transparent rounded-full blur-2xl group-hover:scale-115 group-hover:opacity-100 transition-all duration-600" />
            <div className="absolute bottom-1/4 right-1/4 w-20 h-20 bg-linear-to-tl from-cyan-300/15 to-transparent rounded-full blur-xl group-hover:opacity-100 transition-all duration-800" />
          </div>

          {/* Subtle grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "16px 16px",
            }}
          />

          <div className="relative text-foreground">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="text-sm font-bold leading-tight">
                  Upgrade to Pro
                </h4>
                <p className="mt-0.5 text-[11px] leading-snug opacity-90">
                  Advanced reports, unlimited companies & more
                </p>
              </div>
            </div>

            <Button
              asChild
              size="sm"
              className="w-full h-8 rounded-lg font-medium text-xs shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Link
                href="/settings/billing"
                className="flex items-center justify-center gap-1.5"
              >
                <span>Upgrade</span>
                <Crown />
                {/* <span className="text-xs">→</span> */}
              </Link>
            </Button>
          </div>
        </Card>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      {/* <SidebarRail/> */}
    </Sidebar>
  );
}
