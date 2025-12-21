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

// This is sample data (nav only).
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: "📊",
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
        {
          title: "Analytics",
          url: "/dashboard/analytics",
        },
        {
          title: "Reports",
          url: "/dashboard/reports",
        },
      ],
    },
    {
      title: "Transactions",
      url: "/transactions",
      icon: "💳",
      items: [
        {
          title: "All Transactions",
          url: "/transactions",
        },
        {
          title: "Income",
          url: "/transactions/income",
        },
        {
          title: "Expenses",
          url: "/transactions/expenses",
        },
        {
          title: "Recurring",
          url: "/transactions/recurring",
        },
      ],
    },
    {
      title: "Invoicing",
      url: "/invoices",
      icon: "📄",
      items: [
        {
          title: "All Invoices",
          url: "/invoices",
        },
        {
          title: "Create Invoice",
          url: "/invoices/create",
        },
        {
          title: "Pending",
          url: "/invoices/pending",
        },
        {
          title: "Paid",
          url: "/invoices/paid",
        },
      ],
    },
    {
      title: "Clients",
      url: "/clients",
      icon: "👥",
      items: [
        {
          title: "All Clients",
          url: "/clients",
        },
        {
          title: "Active",
          url: "/clients/active",
        },
        {
          title: "Archived",
          url: "/clients/archived",
        },
      ],
    },
    {
      title: "Suppliers",
      url: "/suppliers",
      icon: "🏢",
      items: [
        {
          title: "All Suppliers",
          url: "/suppliers",
        },
      ],
    },
    {
      title: "Bills & Payables",
      url: "/bills",
      icon: "📋",
      items: [
        {
          title: "All Bills",
          url: "/bills",
        },
        {
          title: "Pending",
          url: "/bills/pending",
        },
        {
          title: "Paid",
          url: "/bills/paid",
        },
      ],
    },
    {
      title: "Payments",
      url: "/payments",
      icon: "💰",
      items: [
        {
          title: "All Payments",
          url: "/payments",
        },
      ],
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: "📦",
      items: [
        {
          title: "All Items",
          url: "/inventory",
        },
        {
          title: "Low Stock",
          url: "/inventory/low-stock",
        },
        {
          title: "Transactions",
          url: "/inventory/transactions",
        },
        {
          title: "Add Item",
          url: "/inventory/add",
        },
      ],
    },
    {
      title: "Financial Reports",
      url: "/reports",
      icon: "📈",
      items: [
        {
          title: "Profit & Loss",
          url: "/reports/profit-loss",
        },
        {
          title: "Balance Sheet",
          url: "/reports/balance-sheet",
        },
        {
          title: "Cash Flow",
          url: "/reports/cash-flow",
        },
        {
          title: "Tax Summary",
          url: "/reports/tax-summary",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: "⚙️",
      items: [
        {
          title: "General",
          url: "/settings/general",
        },
        {
          title: "Company",
          url: "/settings/company",
        },
        {
          title: "Billing",
          url: "/settings/billing",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Q4 Tax Filing",
      url: "/projects/q4-tax-filing",
      icon: "🧮",
    },
    {
      name: "Annual Audit 2025",
      url: "/projects/annual-audit-2025",
      icon: "📋",
    },
    {
      name: "Payroll Management",
      url: "/projects/payroll-management",
      icon: "💰",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user: authUser } = useAuth();
  const displayName =
    (authUser?.first_name && authUser?.last_name
      ? `${authUser.first_name} ${authUser.last_name}`
      : authUser?.name) ||
    (authUser?.email ? authUser.email.split("@")[0] : "User");
  const displayEmail = authUser?.email ?? "";
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
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
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
