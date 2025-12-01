"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SUBSCRIPTION_PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    billingCycle: "monthly",
    description: "Perfect for getting started with basic accounting",
    popular: false,
    features: {
      maxUsers: 1,
      maxCompanies: 1,
      maxInvoicesPerMonth: 10,
      maxCustomers: 20,
      maxSuppliers: 10,
      maxInventoryItems: 50,

      // Module Access
      dashboard: true,
      journalEntry: true,
      ledger: true,
      accountsReceivable: true,
      accountsPayable: true,
      basicReports: true,

      // Advanced Features
      inventoryManagement: false,
      multiCompany: false,
      advancedReports: false,
      financialStatements: false,
      exportReports: false,
      customization: false,
      auditLog: false,
      autoBackup: false,
      apiAccess: false,
      prioritySupport: false,

      // Data Retention
      dataRetentionMonths: 3,
      backupFrequency: null,

      // Branding
      removeBranding: false,
      customLogo: false,
    },
    limits: {
      storageGB: 0.5,
      transactionsPerMonth: 50,
      reportsPerMonth: 10,
    },
  },

  PRO: {
    name: "Pro",
    price: 29.99,
    billingCycle: "monthly",
    description: "Ideal for growing businesses with advanced needs",
    popular: true,
    features: {
      maxUsers: 5,
      maxCompanies: 3,
      maxInvoicesPerMonth: 100,
      maxCustomers: 200,
      maxSuppliers: 100,
      maxInventoryItems: 500,

      // Module Access
      dashboard: true,
      journalEntry: true,
      ledger: true,
      accountsReceivable: true,
      accountsPayable: true,
      basicReports: true,

      // Advanced Features
      inventoryManagement: true,
      multiCompany: true,
      advancedReports: true,
      financialStatements: true,
      exportReports: true, // PDF, Excel
      customization: true, // Logo, headers
      auditLog: true,
      autoBackup: true,
      apiAccess: false,
      prioritySupport: false,

      // Data Retention
      dataRetentionMonths: 12,
      backupFrequency: "weekly",

      // Branding
      removeBranding: false,
      customLogo: true,
    },
    limits: {
      storageGB: 5,
      transactionsPerMonth: 500,
      reportsPerMonth: 100,
    },
  },

  PREMIUM: {
    name: "Premium",
    price: 79.99,
    billingCycle: "monthly",
    description: "Complete solution for established businesses",
    popular: false,
    features: {
      maxUsers: "unlimited",
      maxCompanies: 10,
      maxInvoicesPerMonth: "unlimited",
      maxCustomers: "unlimited",
      maxSuppliers: "unlimited",
      maxInventoryItems: "unlimited",

      // Module Access
      dashboard: true,
      journalEntry: true,
      ledger: true,
      accountsReceivable: true,
      accountsPayable: true,
      basicReports: true,

      // Advanced Features
      inventoryManagement: true,
      multiCompany: true,
      advancedReports: true,
      financialStatements: true,
      exportReports: true, // PDF, Excel, CSV
      customization: true,
      auditLog: true,
      autoBackup: true,
      apiAccess: true,
      prioritySupport: true,

      // Data Retention
      dataRetentionMonths: "unlimited",
      backupFrequency: "daily",

      // Branding
      removeBranding: true,
      customLogo: true,
    },
    limits: {
      storageGB: 50,
      transactionsPerMonth: "unlimited",
      reportsPerMonth: "unlimited",
    },
  },
};

const formatValue = (value: any) => {
  if (value === "unlimited") return "Unlimited";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "boolean") return value;
  if (value === null) return "None";
  return value;
};

const PricingFeature = ({ label, value }: { label: string; value: any }) => {
  const isBoolean = typeof value === "boolean";
  const Icon = isBoolean ? (value ? Check : X) : null;
  const iconColor = isBoolean
    ? value
      ? "text-green-500"
      : "text-muted-foreground"
    : "";

  return (
    <li className="flex items-start gap-2 text-sm">
      {Icon ? (
        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
      ) : (
        <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
      )}
      <span className={isBoolean && !value ? "text-muted-foreground" : ""}>
        {label}
        {!isBoolean && (
          <span className="font-medium ml-1">{formatValue(value)}</span>
        )}
      </span>
    </li>
  );
};

export default function PlansPage() {
  const plans = Object.values(SUBSCRIPTION_PLANS);

  return (
    <div className="bg-background min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your business. All plans include our
            core accounting features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-primary shadow-lg scale-105"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${plan.price.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">
                    /{plan.billingCycle}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {/* Usage Limits */}
                  <li className="font-semibold text-sm text-primary mt-4 mb-2">
                    📊 Usage Limits
                  </li>
                  <PricingFeature
                    label="Users:"
                    value={plan.features.maxUsers}
                  />
                  <PricingFeature
                    label="Companies:"
                    value={plan.features.maxCompanies}
                  />
                  <PricingFeature
                    label="Invoices/month:"
                    value={plan.features.maxInvoicesPerMonth}
                  />
                  <PricingFeature
                    label="Customers:"
                    value={plan.features.maxCustomers}
                  />
                  <PricingFeature
                    label="Storage:"
                    value={`${plan.limits.storageGB} GB`}
                  />

                  {/* Core Modules */}
                  <li className="font-semibold text-sm text-primary mt-4 mb-2">
                    🧾 Core Accounting
                  </li>
                  <PricingFeature
                    label="Dashboard & Analytics"
                    value={plan.features.dashboard}
                  />
                  <PricingFeature
                    label="Journal Entry"
                    value={plan.features.journalEntry}
                  />
                  <PricingFeature
                    label="General Ledger"
                    value={plan.features.ledger}
                  />
                  <PricingFeature
                    label="Accounts Receivable"
                    value={plan.features.accountsReceivable}
                  />
                  <PricingFeature
                    label="Accounts Payable"
                    value={plan.features.accountsPayable}
                  />

                  {/* Advanced Features */}
                  <li className="font-semibold text-sm text-primary mt-4 mb-2">
                    ⚡ Advanced Features
                  </li>
                  <PricingFeature
                    label="Inventory Management"
                    value={plan.features.inventoryManagement}
                  />
                  <PricingFeature
                    label="Multi-Company Support"
                    value={plan.features.multiCompany}
                  />
                  <PricingFeature
                    label="Financial Statements"
                    value={plan.features.financialStatements}
                  />
                  <PricingFeature
                    label="Advanced Reports"
                    value={plan.features.advancedReports}
                  />
                  <PricingFeature
                    label="Export Reports (PDF/Excel)"
                    value={plan.features.exportReports}
                  />
                  <PricingFeature
                    label="Audit Log"
                    value={plan.features.auditLog}
                  />
                  <PricingFeature
                    label="Auto Backup"
                    value={
                      plan.features.autoBackup
                        ? `(${plan.features.backupFrequency})`
                        : false
                    }
                  />
                  <PricingFeature
                    label="API Access"
                    value={plan.features.apiAccess}
                  />
                  <PricingFeature
                    label="Priority Support"
                    value={plan.features.prioritySupport}
                  />

                  {/* Branding */}
                  <li className="font-semibold text-sm text-primary mt-4 mb-2">
                    🎨 Customization
                  </li>
                  <PricingFeature
                    label="Custom Logo"
                    value={plan.features.customLogo}
                  />
                  <PricingFeature
                    label="Remove Branding"
                    value={plan.features.removeBranding}
                  />
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  {plan.price === 0 ? "Get Started Free" : "Subscribe Now"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            All plans include email support. Cancel anytime with no hidden fees.
          </p>
          <p className="mt-2">
            Need a custom plan?{" "}
            <a href="/contact" className="text-primary hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}