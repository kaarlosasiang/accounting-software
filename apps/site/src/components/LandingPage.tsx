import { useState, useEffect } from "react";
import {
  Check,
  X,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Users,
  BarChart,
  Layers,
} from "lucide-react";
import { Button } from "ui/components/button";
import { Badge } from "ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "ui/components/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "ui/components/accordion";

export function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const features = [
    {
      title: "CSV/Excel Imports",
      description: "Upload bank statements as CSV to get started fast.",
      icon: <Layers className="size-5" />,
    },
    {
      title: "Secure Auth + OTP",
      description: "Email/password with one‑time codes for added protection.",
      icon: <Shield className="size-5" />,
    },
    {
      title: "Structured Logging",
      description:
        "Request/response logging and API key middleware scaffolding.",
      icon: <BarChart className="size-5" />,
    },
    {
      title: "Invoices, Bills, Ledger",
      description: "Core accounting objects — API and UI coming soon.",
      comingSoon: true,
      icon: <Zap className="size-5" />,
    },
    {
      title: "Reports & Exports",
      description:
        "Export CSV today; advanced financial reports on the roadmap.",
      icon: <Star className="size-5" />,
    },
    {
      title: "Roles & Approvals",
      description: "Granular permissions and approvals — coming soon.",
      comingSoon: true,
      icon: <Users className="size-5" />,
    },
  ];

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
        storageGB: 0.5,
        dashboard: true,
        journalEntry: true,
        ledger: true,
        accountsReceivable: true,
        accountsPayable: true,
        inventoryManagement: false,
        multiCompany: false,
        advancedReports: false,
        financialStatements: false,
        exportReports: false,
        auditLog: false,
        autoBackup: false,
        backupFrequency: null as string | null,
        apiAccess: false,
        prioritySupport: false,
        customLogo: false,
        removeBranding: false,
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
        storageGB: 5,
        dashboard: true,
        journalEntry: true,
        ledger: true,
        accountsReceivable: true,
        accountsPayable: true,
        inventoryManagement: true,
        multiCompany: true,
        advancedReports: true,
        financialStatements: true,
        exportReports: true,
        auditLog: true,
        autoBackup: true,
        backupFrequency: "weekly" as string | null,
        apiAccess: false,
        prioritySupport: false,
        customLogo: true,
        removeBranding: false,
      },
    },
    PREMIUM: {
      name: "Premium",
      price: 79.99,
      billingCycle: "monthly",
      description: "Complete solution for established businesses",
      popular: false,
      features: {
        maxUsers: "unlimited" as number | string,
        maxCompanies: 10,
        maxInvoicesPerMonth: "unlimited" as number | string,
        maxCustomers: "unlimited" as number | string,
        storageGB: 50,
        dashboard: true,
        journalEntry: true,
        ledger: true,
        accountsReceivable: true,
        accountsPayable: true,
        inventoryManagement: true,
        multiCompany: true,
        advancedReports: true,
        financialStatements: true,
        exportReports: true,
        auditLog: true,
        autoBackup: true,
        backupFrequency: "daily" as string | null,
        apiAccess: true,
        prioritySupport: true,
        customLogo: true,
        removeBranding: true,
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
      <li className="flex items-start gap-2 text-xs">
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

  return (
    <div className="w-full flex min-h-dvh flex-col relative">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
          <div className="mr-4 flex">
            <a href="/" className="mr-6 flex items-center space-x-2">
              <img
                src="/am-fintrass-logo.png"
                alt="AM FINTRASS"
                width={130}
                height={40}
                className="h-8 w-auto"
              />
            </a>
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <a
                href="#features"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                FAQ
              </a>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <a href="https://app.amfintrass.com/login">Sign In</a>
              </Button>
              <Button size="sm" asChild>
                <a href="https://app.amfintrass.com/signup">Get Started</a>
              </Button>
            </nav>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full overflow-hidden">
          <div className="px-4 md:px-6 relative py-20 md:py-32 lg:py-40">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge
                className="mb-4 rounded-full px-4 py-1.5 text-sm font-medium"
                variant="secondary"
              >
                Launching Soon
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
                Close Your Books Faster with AM FINTRASS
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Smart accounting built for growing businesses. Import bank
                statements via CSV, categorize transactions, and get up‑to‑date
                cash flow and profit insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="rounded-full h-12 px-8 text-base"
                  asChild
                >
                  <a href="https://app.amfintrass.com/signup">
                    Start Free Trial
                    <ArrowRight className="ml-2 size-4" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full h-12 px-8 text-base"
                  asChild
                >
                  <a href="https://app.amfintrass.com/demo">Book a Demo</a>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Check className="size-4 text-primary" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="size-4 text-primary" />
                  <span>14-day trial</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="size-4 text-primary" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            <div className="relative mx-auto max-w-5xl">
              <div className="rounded-xl overflow-hidden shadow-2xl border border-border/40 bg-linear-to-b from-background to-muted/20">
                <div className="relative w-full aspect-video bg-muted/40">
                  {mounted ? (
                    <img
                      src="/dashboard-preview-light.png"
                      alt="Financial dashboard preview"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-lg">
                      Loading preview…
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10"></div>
              </div>
              <div className="absolute -bottom-6 -right-6 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-3xl opacity-70"></div>
              <div className="absolute -top-6 -left-6 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-secondary/30 to-primary/30 blur-3xl opacity-70"></div>
            </div>
          </div>
        </section>

        {/* Logos Section */}
        <section className="w-full py-12 border-y bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Trusted by innovative companies worldwide
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-32 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0 bg-muted rounded flex items-center justify-center text-xs font-medium"
                  >
                    Company {i}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <Badge
                className="rounded-full px-4 py-1.5 text-sm font-medium"
                variant="secondary"
              >
                Features
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Everything You Need to Succeed
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg">
                Our comprehensive platform provides all the tools you need to
                streamline your workflow, boost productivity, and achieve your
                goals.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, idx) => (
                <Card
                  key={idx}
                  className="h-full overflow-hidden border-border/40 bg-linear-to-b from-background to-muted/10 backdrop-blur transition-all hover:shadow-md"
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="size-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                      <span>{feature.title}</span>
                      {feature.comingSoon && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0.5"
                        >
                          Coming Soon
                        </Badge>
                      )}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-20 md:py-32 bg-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]"></div>
          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <Badge
                className="rounded-full px-4 py-1.5 text-sm font-medium"
                variant="secondary"
              >
                How It Works
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Simple Process, Powerful Results
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg">
                Get started in minutes and see the difference our platform can
                make for your business.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-border to-transparent -translate-y-1/2 z-0"></div>
              {[
                {
                  step: "01",
                  title: "Sign Up & Verify Email",
                  description: "Create your account and verify via OTP email.",
                },
                {
                  step: "02",
                  title: "Import Transactions (CSV)",
                  description:
                    "Upload bank statements as CSV to populate your books.",
                },
                {
                  step: "03",
                  title: "Categorize & Export (CSV)",
                  description:
                    "Categorize transactions and export results; advanced reports coming soon.",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="relative z-10 flex flex-col items-center text-center space-y-4"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xl font-bold shadow-lg">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="pricing"
          className="w-full py-20 md:py-32 bg-muted/30 relative overflow-hidden"
        >
          <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]"></div>
          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <Badge
                className="rounded-full px-4 py-1.5 text-sm font-medium"
                variant="secondary"
              >
                Pricing
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Choose Your Plan
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg">
                Select the perfect plan for your business. All plans include our
                core accounting features.
              </p>
            </div>
            <div className="mx-auto max-w-7xl">
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                  <Card
                    key={plan.name}
                    className={`relative flex flex-col ${
                      plan.popular
                        ? "border-primary shadow-lg md:scale-105"
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
                      <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <li className="col-span-2 font-semibold text-sm text-primary mt-4 mb-2">
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
                          value={`${plan.features.storageGB} GB`}
                        />

                        <li className="col-span-2 font-semibold text-sm text-primary mt-4 mb-2">
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

                        <li className="col-span-2 font-semibold text-sm text-primary mt-4 mb-2">
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

                        <li className="col-span-2 font-semibold text-sm text-primary mt-4 mb-2">
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
                        asChild
                      >
                        <a href="https://app.amfintrass.com/signup">
                          {plan.price === 0
                            ? "Get Started Free"
                            : "Subscribe Now"}
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  All plans include email support. Cancel anytime with no hidden
                  fees.
                </p>
                <p className="mt-2">
                  Need a custom plan?{" "}
                  <a href="#" className="text-primary hover:underline">
                    Contact us
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <Badge
                className="rounded-full px-4 py-1.5 text-sm font-medium"
                variant="secondary"
              >
                FAQ
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg">
                Find answers to common questions about our platform.
              </p>
            </div>
            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {[
                  {
                    question: "Do you support bank connections?",
                    answer:
                      "Not yet. Please import statement files via CSV. Direct bank integrations are on our roadmap.",
                  },
                  {
                    question: "How do you handle data security?",
                    answer:
                      "We use bank‑grade encryption (in transit and at rest), MFA, role‑based access, and detailed audit trails.",
                  },
                  {
                    question: "Do you support multi‑currency and tax?",
                    answer:
                      "Professional and Enterprise include multi‑currency, tax categories, and localized reporting presets.",
                  },
                  {
                    question: "Can my external accountant access our books?",
                    answer:
                      "Absolutely. Invite them for free with accountant‑specific permissions and read‑only or review access.",
                  },
                  {
                    question: "Can you migrate data from my current system?",
                    answer:
                      "Yes. We provide guided import for chart of accounts, contacts, items, and historical transactions.",
                  },
                  {
                    question: "How does the free trial work?",
                    answer:
                      "Try all features for 14 days—no credit card required. Cancel anytime during the trial.",
                  },
                ].map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`item-${i}`}
                    className="border-b border-border/40 py-2"
                  >
                    <AccordionTrigger className="text-left font-medium hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 md:py-32 bg-linear-to-br from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                Ready to Close the Books Faster?
              </h2>
              <p className="mx-auto max-w-[700px] text-primary-foreground/80 md:text-xl">
                Join thousands of satisfied customers who have streamlined their
                processes and boosted productivity with our platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full h-12 px-8 text-base"
                  asChild
                >
                  <a href="https://app.amfintrass.com/signup">
                    Start Free Trial
                    <ArrowRight className="ml-2 size-4" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full h-12 px-8 text-base bg-transparent border-white text-white hover:bg-white/10"
                >
                  Schedule a Demo
                </Button>
              </div>
              <p className="text-sm text-primary-foreground/80 mt-4">
                No credit card required. 14‑day free trial. Cancel anytime.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex flex-col gap-8 px-4 py-10 md:px-6 lg:py-16">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img
                  src="/am-fintrass-logo.png"
                  alt="AM FINTRASS Logo"
                  width={130}
                  height={40}
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Streamline your workflow with our all-in-one SaaS platform.
                Boost productivity and scale your business.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-5"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                  <span className="sr-only">Facebook</span>
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-5"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                  <span className="sr-only">Twitter</span>
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-5"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect width="4" height="12" x="2" y="9"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                  <span className="sr-only">LinkedIn</span>
                </a>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#features"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Integrations
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Guides
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row justify-between items-center border-t border-border/40 pt-8">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} AM FINTRASS. All rights
              reserved.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
