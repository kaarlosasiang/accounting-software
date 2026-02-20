import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Can I connect my bank account directly?",
    a: "Currently you can import transactions via CSV bank statements. Direct bank connections (Open Banking) are on our roadmap for a future release.",
  },
  {
    q: "How secure is my financial data?",
    a: "All data is encrypted with AES-256 at rest and in transit. We enforce MFA on every login, use role-based access control, and maintain full audit logs of every change.",
  },
  {
    q: "Does AM FINTRASS support multi-currency and tax?",
    a: "Multi-currency support and tax reporting are available on Pro and Premium plans. You can set your company's base currency and record transactions in foreign currencies.",
  },
  {
    q: "Can I invite my external accountant?",
    a: "Yes — you can invite team members with specific roles including a read-only accountant role, letting them view reports and ledgers without changing any records.",
  },
  {
    q: "How do I migrate my existing data?",
    a: "We provide guided CSV import for chart of accounts, contacts, inventory items, and transaction history. Our onboarding walks you through each step.",
  },
  {
    q: "What's included in the free trial?",
    a: "Every plan starts with a 14-day free trial at the Pro tier. No credit card required. After the trial you can choose any plan or stay on the Free tier.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">
            // FAQ
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
            Frequently asked <span className="text-primary">questions.</span>
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          {faqs.map((item, i) => (
            <div
              key={i}
              className="border border-border rounded-xl bg-card overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">
                  {item.q}
                </span>
                <ChevronDown
                  size={16}
                  className={`flex-shrink-0 text-muted-foreground transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  open === i ? "max-h-48" : "max-h-0"
                }`}
              >
                <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
