import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Sign Up & Connect",
    description:
      "Create your company in minutes. Import your chart of accounts or use a ready-made template.",
    code: `amFintrass.company.create({
  name: "Acme Corp",
  currency: "USD",
  template: "service",
  // Chart of accounts auto-populated
  fiscalYear: "calendar",
});`,
  },
  {
    number: "02",
    title: "Import & Categorize",
    description:
      "Upload CSV bank statements. Auto-categorize transactions against your chart of accounts.",
    code: `amFintrass.transactions.import({
  source: "csv",
  file: bankStatement,
  autoCategorize: true,
  // Matches against your COA
  onConflict: "review",
});`,
  },
  {
    number: "03",
    title: "Report & Export",
    description:
      "Generate P&L, Balance Sheet, and Cash Flow reports instantly. Export to PDF or Excel.",
    code: `amFintrass.reports.generate({
  type: "profit-loss",
  period: "Q1-2026",
  format: "pdf",
  // Live in < 5 seconds
  compare: "prior-quarter",
});`,
  },
];

function highlight(code: string) {
  return code
    .replace(
      /("[\w\-\/\.\s]+")/g,
      '<span style="color:oklch(0.75 0.15 150)">$1</span>',
    )
    .replace(
      /\b(true|false|null)\b/g,
      '<span style="color:oklch(0.7 0.2 40)">$1</span>',
    )
    .replace(
      /(\/\/[^\n]*)/g,
      '<span style="color:oklch(0.55 0.03 240)">$1</span>',
    )
    .replace(
      /\b(amFintrass\.[a-z.]+)\b/g,
      '<span style="color:oklch(0.75 0.18 210)">$1</span>',
    );
}

export function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const DURATION = 4000;
  const intervalRef = useRef<number | null>(null);
  const startRef = useRef<number>(Date.now());

  const startCycle = (stepIndex: number) => {
    setActive(stepIndex);
    setProgress(0);
    startRef.current = Date.now();

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (elapsed >= DURATION) {
        const next = (stepIndex + 1) % steps.length;
        startCycle(next);
      }
    }, 50);
  };

  useEffect(() => {
    startCycle(0);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleStepClick = (index: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    startCycle(index);
  };

  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">
            // WORKFLOW
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
            Three steps to <span className="text-primary">clean books.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Steps list */}
          <div className="space-y-3">
            {steps.map((step, i) => (
              <button
                key={step.number}
                onClick={() => handleStepClick(i)}
                className={`w-full text-left p-5 rounded-xl border transition-all duration-300 ${
                  active === i
                    ? "border-primary/50 bg-card"
                    : "border-border bg-card/50 hover:border-border/80"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`font-mono text-lg font-bold tabular-nums transition-colors ${
                      active === i ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {step.number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold mb-1 transition-colors ${
                        active === i
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </h3>
                    {active === i && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    )}
                    {/* Progress bar */}
                    {active === i && (
                      <div className="mt-3 h-0.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-none"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Code panel */}
          <div className="rounded-xl border border-border bg-card overflow-hidden card-shadow lg:sticky lg:top-24">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs font-mono text-muted-foreground">
                accounting.ts
              </span>
            </div>
            {/* Code content */}
            <div className="p-6 overflow-x-auto">
              <pre className="text-sm font-mono leading-relaxed text-muted-foreground">
                <code
                  dangerouslySetInnerHTML={{
                    __html: highlight(steps[active].code),
                  }}
                />
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
