import type { DriveStep } from "driver.js";

export const tourSteps: DriveStep[] = [
  {
    element: "[data-tour='sidebar']",
    popover: {
      title: "Navigation Sidebar",
      description:
        "Use the sidebar to navigate between all modules — Accounts, Invoices, Bills, Reports, and more.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='nav-dashboard']",
    popover: {
      title: "Dashboard",
      description:
        "Your financial overview: revenue, expenses, and profit at a glance.",
      side: "right",
    },
  },
  {
    element: "[data-tour='nav-accounts']",
    popover: {
      title: "Chart of Accounts",
      description:
        "Manage your company's accounts — assets, liabilities, income, and expenses.",
      side: "right",
    },
  },
  {
    element: "[data-tour='nav-invoices']",
    popover: {
      title: "Invoices",
      description: "Create and track invoices sent to your customers.",
      side: "right",
    },
  },
  {
    element: "[data-tour='nav-bills']",
    popover: {
      title: "Bills",
      description: "Record bills from suppliers and track what you owe.",
      side: "right",
    },
  },
  {
    element: "[data-tour='nav-reports']",
    popover: {
      title: "Reports",
      description:
        "Generate financial reports: balance sheet, income statement, cash flow, and more.",
      side: "right",
    },
  },
  {
    element: "[data-tour='onboarding-checklist']",
    popover: {
      title: "Setup Checklist",
      description:
        "This checklist tracks your remaining setup steps. It disappears once everything is done.",
      side: "bottom",
      align: "start",
    },
  },
];
