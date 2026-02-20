import { useEffect, useRef, useState } from "react";
import { AsciiWave } from "../ascii/AsciiWave";

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

interface Counter {
  target: number;
  suffix: string;
  prefix: string;
  label: string;
  sub: string;
}

const counters: Counter[] = [
  {
    prefix: "",
    target: 999,
    suffix: "%",
    label: "Uptime this month",
    sub: "SLA guaranteed",
  },
  {
    prefix: "< ",
    target: 5,
    suffix: " min",
    label: "Average report generation",
    sub: "P&L to PDF",
  },
  {
    prefix: "",
    target: 14,
    suffix: " days",
    label: "Avg trial-to-paid",
    sub: "No card required to start",
  },
  {
    prefix: "",
    target: 15,
    suffix: "+",
    label: "Report types",
    sub: "P&L, BS, CF, AR/AP, Tax...",
  },
];

function AnimatedCounter({ counter }: { counter: Counter }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const duration = 1800;
          const tick = () => {
            const elapsed = Date.now() - start;
            const t = Math.min(elapsed / duration, 1);
            setValue(Math.floor(easeOut(t) * counter.target));
            if (t < 1) requestAnimationFrame(tick);
            else setValue(counter.target);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [counter.target]);

  const display =
    counter.target === 999
      ? `99.9${counter.suffix}`
      : `${counter.prefix}${value}${counter.suffix}`;

  return (
    <div ref={ref} className="p-6 bg-card border border-border rounded-xl">
      <div className="text-3xl font-bold text-foreground tabular-nums">
        {display}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground/80">
        {counter.label}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{counter.sub}</div>
    </div>
  );
}

const activityLog = [
  {
    method: "POST",
    path: "/api/journal-entries",
    region: "us-east",
    status: 201,
    ms: 38,
  },
  {
    method: "GET",
    path: "/api/reports/profit-loss",
    region: "eu-west",
    status: 200,
    ms: 52,
  },
  {
    method: "POST",
    path: "/api/invoices",
    region: "ap-south",
    status: 201,
    ms: 44,
  },
  {
    method: "GET",
    path: "/api/ledger",
    region: "us-east",
    status: 200,
    ms: 29,
  },
];

export function MetricsSection() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(
        d.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative py-24 overflow-hidden">
      {/* AsciiWave background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07]">
        <AsciiWave className="w-full h-full object-cover" />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 50% 50%, transparent 40%, var(--background) 80%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">
            // PLATFORM STATUS
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
            Real-time platform{" "}
            <span className="text-primary">performance.</span>
          </h2>
        </div>

        {/* Live clock */}
        <div className="flex items-center gap-2 mb-12 text-sm font-mono text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          All systems operational &nbsp;|&nbsp; {time}
        </div>

        {/* Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {counters.map((c) => (
            <AnimatedCounter key={c.label} counter={c} />
          ))}
        </div>

        {/* Live activity feed */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground">
              Live API activity
            </span>
          </div>
          <div className="divide-y divide-border">
            {activityLog.map((log, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-5 py-3 text-xs font-mono"
              >
                <span
                  className={`w-10 text-right font-bold ${
                    log.method === "POST"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {log.method}
                </span>
                <span className="flex-1 text-foreground/80 truncate">
                  {log.path}
                </span>
                <span className="text-muted-foreground hidden sm:block">
                  {log.region}
                </span>
                <span
                  className={`w-10 text-right ${
                    log.status < 300 ? "text-primary" : "text-red-400"
                  }`}
                >
                  {log.status}
                </span>
                <span className="text-muted-foreground w-14 text-right">
                  {log.ms}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
