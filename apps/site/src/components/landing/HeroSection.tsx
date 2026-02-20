import { useEffect, useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { AsciiWave } from "../ascii/AsciiWave";

const stats = [
  { value: "10 min", label: "average setup time.", tag: "QUICKSTART" },
  { value: "50%", label: "faster month-end close.", tag: "PRODUCTIVITY" },
  { value: "99.9%", label: "uptime guarantee.", tag: "RELIABILITY" },
  { value: "14 days", label: "free trial, no card needed.", tag: "RISK-FREE" },
];

export function HeroSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Grid pattern background */}
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />

      {/* ASCII Wave background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.18]">
        <AsciiWave className="w-full h-full object-cover" />
      </div>

      {/* Radial gradient mask over wave */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, var(--background) 75%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Badge */}
        <div
          className={`transition-all duration-700 delay-100 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-mono font-medium border border-primary/40 rounded-full bg-primary/10 text-primary mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Launching Soon
          </span>
        </div>

        {/* Headline */}
        <h1
          className={`text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl transition-all duration-700 delay-150 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Close Your Books <span className="text-primary">Faster.</span>
        </h1>

        {/* Sub */}
        <p
          className={`mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed transition-all duration-700 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Smart accounting built for growing businesses. Journal entries,
          invoices, reports, and real-time cash flow — all in one place.
        </p>

        {/* CTAs */}
        <div
          className={`mt-8 flex flex-wrap gap-3 transition-all duration-700 delay-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <a
            href="https://app.amfintrass.com/signup"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Start Free Trial
            <ArrowRight size={14} />
          </a>
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-foreground text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            <BookOpen size={14} />
            View Features
          </a>
        </div>

        {/* Trust markers */}
        <p
          className={`mt-5 text-xs font-mono text-muted-foreground transition-all duration-700 delay-350 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          ✓ No credit card &nbsp;&nbsp; ✓ 14-day trial &nbsp;&nbsp; ✓ Cancel
          anytime
        </p>

        {/* Stats bar */}
        <div
          className={`mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px border border-border rounded-xl overflow-hidden bg-border transition-all duration-700 delay-400 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {stats.map((stat) => (
            <div
              key={stat.tag}
              className="bg-card px-6 py-5 flex flex-col gap-1"
            >
              <span className="text-2xl font-bold text-foreground">
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground leading-snug">
                {stat.label}
              </span>
              <span className="mt-1 text-[10px] font-mono text-primary/70 tracking-widest uppercase">
                {stat.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
