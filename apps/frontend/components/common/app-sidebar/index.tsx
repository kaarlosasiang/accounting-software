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

// This is sample data.
const data = {
  user: {
    name: "John Accountant",
    email: "john@rrd10.com",
    avatar: "/avatars/user.jpg",
  },
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
        {
          title: "Integrations",
          url: "/settings/integrations",
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
  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square items-center justify-center rounded-lg">
                <Image
                  src={"/rrd10_icon.png"}
                  alt={"RRD10 Icon"}
                  width={32}
                  height={32}
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold">RRD10</span>
                <span className="truncate text-xs">
                  Smart Accounting System
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      {/* <SidebarRail/> */}
    </Sidebar>
  );
}
