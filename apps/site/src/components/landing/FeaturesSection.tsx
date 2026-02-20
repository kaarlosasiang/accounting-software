import { useEffect, useRef, useState } from "react";

interface Feature {
  title: string;
  description: string;
  frames: string[][];
}

const features: Feature[] = [
  {
    title: "Double-Entry Journal",
    description:
      "Every transaction balanced automatically. Full audit trail, no manual reconciliation needed.",
    frames: [
      [
        "┌──────────────────┐",
        "│ DEBIT    CREDIT  │",
        "│ ─────────────── │",
        "│ Cash  +  Rev  ─ │",
        "│  500     500    │",
        "│ ✓ Balanced      │",
        "└──────────────────┘",
      ],
      [
        "┌──────────────────┐",
        "│ DEBIT    CREDIT  │",
        "│ ─────────────── │",
        "│ Exp   +  AP   ─ │",
        "│  200     200    │",
        "│ ✓ Balanced      │",
        "└──────────────────┘",
      ],
      [
        "┌──────────────────┐",
        "│ DEBIT    CREDIT  │",
        "│ ─────────────── │",
        "│ AR    +  Rev  ─ │",
        "│ 1200    1200    │",
        "│ ✓ Balanced      │",
        "└──────────────────┘",
      ],
    ],
  },
  {
    title: "Invoicing & AR",
    description:
      "Create, send, and track invoices. Know exactly who owes you and when.",
    frames: [
      [
        "┌──────────────────┐",
        "│ INV #1042        │",
        "│ Status: PENDING  │",
        "│ Due: 2026-03-01  │",
        "│ Amount: $2,400   │",
        "│ [Send Reminder]  │",
        "└──────────────────┘",
      ],
      [
        "┌──────────────────┐",
        "│ INV #1043        │",
        "│ Status: PAID ✓   │",
        "│ Paid: 2026-02-15 │",
        "│ Amount: $1,800   │",
        "│ [View Receipt]   │",
        "└──────────────────┘",
      ],
      [
        "┌──────────────────┐",
        "│ INV #1044        │",
        "│ Status: OVERDUE  │",
        "│ Due: 2026-01-30  │",
        "│ Amount: $950     │",
        "│ [Escalate]       │",
        "└──────────────────┘",
      ],
    ],
  },
  {
    title: "Bills & AP",
    description:
      "Manage supplier bills and payments. Never miss a payment due date again.",
    frames: [
      [
        "┌──────────────────┐",
        "│ BILL #B-221      │",
        "│ Vendor: AWS Inc  │",
        "│ Due: 2026-03-05  │",
        "│ Amount: $340     │",
        "│ Status: DUE SOON │",
        "└──────────────────┘",
      ],
      [
        "┌──────────────────┐",
        "│ BILL #B-222      │",
        "│ Vendor: Office+  │",
        "│ Due: 2026-03-10  │",
        "│ Amount: $120     │",
        "│ Status: PENDING  │",
        "└──────────────────┘",
      ],
      [
        "┌──────────────────┐",
        "│ BILL #B-223      │",
        "│ Vendor: Telco    │",
        "│ Paid: 2026-02-01 │",
        "│ Amount: $89      │",
        "│ Status: PAID ✓   │",
        "└──────────────────┘",
      ],
    ],
  },
  {
    title: "Financial Reports",
    description:
      "P&L, Balance Sheet, Cash Flow — generated instantly from your live data.",
    frames: [
      [
        "┌──────────────────┐",
        "│ PROFIT & LOSS    │",
        "│ Revenue  $48,000 │",
        "│ Expenses $31,200 │",
        "│ ────────────────│",
        "│ Net     $16,800  │",
        "└──────────────────┘",
      ],
      [
        "┌──────────────────┐",
        "│ BALANCE SHEET    │",
        "│ Assets  $120,400 │",
        "│ Liabi.  $ 42,800 │",
        "│ ────────────────│",
        "│ Equity  $ 77,600 │",
        "└──────────────────┘",
      ],
      [
        "┌──────────────────┐",
        "│ CASH FLOW        │",
        "│ Oper.  +$14,200  │",
        "│ Invest. -$8,000  │",
        "│ ────────────────│",
        "│ Net    + $6,200  │",
        "└──────────────────┘",
      ],
    ],
  },
  {
    title: "Multi-Company",
    description:
      "Manage multiple businesses from one login. Isolated books, shared dashboard.",
    frames: [
      [
        "┌──────────────────┐",
        "│ [▣] Acme Corp    │",
        "│ [▣] Bright Labs  │",
        "│ [○] StartupXYZ   │",
        "│ [+] Add Company  │",
        "│ Switch → Acme    │",
        "└──────────────────┘",
      ],
      [
        "┌──────────────────┐",
        "│ [▣] Acme Corp    │",
        "│ [○] Bright Labs  │",
        "│ [▣] StartupXYZ   │",
        "│ [+] Add Company  │",
        "│ Switch → Startup │",
        "└──────────────────┘",
      ],
      [
        "┌──────────────────┐",
        "│ [○] Acme Corp    │",
        "│ [▣] Bright Labs  │",
        "│ [○] StartupXYZ   │",
        "│ [+] Add Company  │",
        "│ Switch → Bright  │",
        "└──────────────────┘",
      ],
    ],
  },
  {
    title: "Secure Auth + OTP",
    description:
      "Email + password with one-time codes and RBAC. Bank-grade access controls.",
    frames: [
      [
        "┌──────────────────┐",
        "│ ╔═══════════╗   │",
        "│ ║  ◈  LOCK  ║   │",
        "│ ╚═══════════╝   │",
        "│ Enter OTP:      │",
        "│ [ _ _ _ _ _ _ ] │",
        "└──────────────────┘",
      ],
      [
        "┌──────────────────┐",
        "│ ╔═══════════╗   │",
        "│ ║  ◉  AUTH  ║   │",
        "│ ╚═══════════╝   │",
        "│ Verifying...    │",
        "│ ████████░░░░░░  │",
        "└──────────────────┘",
      ],
      [
        "┌──────────────────┐",
        "│ ╔═══════════╗   │",
        "│ ║  ✓  ACCESS ║  │",
        "│ ╚═══════════╝   │",
        "│ Role: ADMIN     │",
        "│ Access Granted  │",
        "└──────────────────┘",
      ],
    ],
  },
];

function AsciiCard({ frames }: { frames: string[][] }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % frames.length), 900);
    return () => clearInterval(id);
  }, [frames.length]);
  return (
    <pre className="text-[10px] leading-tight font-mono text-primary/80 select-none">
      {frames[frame].join("\n")}
    </pre>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">
            // PLATFORM
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
            Everything you need to{" "}
            <span className="text-primary">close the books.</span>
          </h2>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feat) => (
            <div
              key={feat.title}
              className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-all duration-300 card-shadow"
            >
              {/* ASCII animation block */}
              <div className="mb-5 h-[110px] flex items-start overflow-hidden">
                <AsciiCard frames={feat.frames} />
              </div>

              <h3 className="text-base font-semibold text-foreground mb-2">
                {feat.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
