import { useState } from "react";
import { Check, Minus } from "lucide-react";

const plans = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Perfect for freelancers and solo bookkeepers.",
    highlight: false,
    features: [
      { label: "1 user", included: true },
      { label: "1 company", included: true },
      { label: "10 invoices / month", included: true },
      { label: "0.5 GB storage", included: true },
      { label: "Dashboard & Overview", included: true },
      { label: "Journal Entry & Ledger", included: true },
      { label: "AR & AP", included: true },
      { label: "CSV Exports", included: true },
      { label: "Inventory Management", included: false },
      { label: "Multi-Company", included: false },
      { label: "Financial Statements", included: false },
      { label: "PDF / Excel Export", included: false },
      { label: "Audit Log", included: false },
      { label: "API Access", included: false },
    ],
    cta: "Get started free",
    ctaHref: "https://app.amfintrass.com/signup",
  },
  {
    name: "Pro",
    monthlyPrice: 29.99,
    annualPrice: 24.99,
    description: "For growing teams who need more power.",
    highlight: true,
    badge: "Most Popular",
    features: [
      { label: "5 users", included: true },
      { label: "3 companies", included: true },
      { label: "100 invoices / month", included: true },
      { label: "5 GB storage", included: true },
      { label: "Dashboard & Overview", included: true },
      { label: "Journal Entry & Ledger", included: true },
      { label: "AR & AP", included: true },
      { label: "CSV Exports", included: true },
      { label: "Inventory Management", included: true },
      { label: "Multi-Company", included: true },
      { label: "Financial Statements", included: true },
      { label: "PDF / Excel Export", included: true },
      { label: "Audit Log", included: true },
      { label: "API Access", included: false },
    ],
    cta: "Start Pro trial",
    ctaHref: "https://app.amfintrass.com/signup?plan=pro",
  },
  {
    name: "Premium",
    monthlyPrice: 79.99,
    annualPrice: 66.99,
    description: "For agencies and enterprises with unlimited needs.",
    highlight: false,
    features: [
      { label: "Unlimited users", included: true },
      { label: "10 companies", included: true },
      { label: "Unlimited invoices", included: true },
      { label: "50 GB storage", included: true },
      { label: "Dashboard & Overview", included: true },
      { label: "Journal Entry & Ledger", included: true },
      { label: "AR & AP", included: true },
      { label: "CSV Exports", included: true },
      { label: "Inventory Management", included: true },
      { label: "Multi-Company", included: true },
      { label: "Financial Statements", included: true },
      { label: "PDF / Excel Export", included: true },
      { label: "Audit Log", included: true },
      { label: "API Access", included: true },
    ],
    cta: "Start Premium trial",
    ctaHref: "https://app.amfintrass.com/signup?plan=premium",
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">
            // PRICING
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
            Simple, <span className="text-primary">transparent pricing.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Free to start. Scales with your business.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center gap-3 mb-12">
          <button
            onClick={() => setAnnual(false)}
            className={`text-sm font-medium transition-colors ${
              !annual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual((v) => !v)}
            className="relative w-12 h-6 rounded-full bg-muted border border-border transition-colors"
            aria-label="Toggle annual billing"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-primary transition-transform duration-200 ${
                annual ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`text-sm font-medium transition-colors ${
              annual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Annual
          </button>
          {annual && (
            <span className="text-xs font-mono text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 rounded-full">
              Save ~17%
            </span>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-6 flex flex-col card-shadow transition-all duration-300 ${
                plan.highlight
                  ? "border-primary/60 bg-card ring-1 ring-primary/20"
                  : "border-border bg-card hover:border-border/80"
              }`}
            >
              {plan.highlight && plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-mono font-medium rounded-full bg-primary text-primary-foreground">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-bold text-foreground tabular-nums">
                    $
                    {annual
                      ? plan.annualPrice.toFixed(2)
                      : plan.monthlyPrice.toFixed(2)}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-sm text-muted-foreground mb-1.5">
                      /mo
                    </span>
                  )}
                  {plan.monthlyPrice === 0 && (
                    <span className="text-sm text-muted-foreground mb-1.5">
                      forever
                    </span>
                  )}
                </div>
                {annual && plan.monthlyPrice > 0 && (
                  <p className="mt-1 text-xs font-mono text-muted-foreground">
                    billed ${(plan.annualPrice * 12).toFixed(2)} / year
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((feat) => (
                  <li
                    key={feat.label}
                    className="flex items-center gap-2.5 text-sm"
                  >
                    {feat.included ? (
                      <Check size={14} className="text-primary flex-shrink-0" />
                    ) : (
                      <Minus
                        size={14}
                        className="text-muted-foreground/40 flex-shrink-0"
                      />
                    )}
                    <span
                      className={
                        feat.included
                          ? "text-foreground/80"
                          : "text-muted-foreground/50"
                      }
                    >
                      {feat.label}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.ctaHref}
                className={`block w-full py-2.5 px-4 rounded-lg text-sm font-medium text-center transition-all duration-200 ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border hover:border-primary/40 hover:bg-muted/50 text-foreground"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs font-mono text-muted-foreground">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
