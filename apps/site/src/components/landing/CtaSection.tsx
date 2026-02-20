import { ArrowRight, Calendar } from "lucide-react";
import { AsciiCube } from "../ascii/AsciiCube";
import { AsciiSphere } from "../ascii/AsciiSphere";

export function CtaSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl bg-foreground overflow-hidden p-12 sm:p-16">
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, oklch(0.6 0.02 260 / 0.15) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* ASCII Cube background (right) */}
          <div className="absolute right-16 top-1/2 -translate-y-1/2 pointer-events-none opacity-[0.18] hidden lg:block">
            <AsciiCube className="w-64 h-64" />
          </div>

          {/* ASCII Sphere (far right, desktop only) */}
          <div className="absolute right-0 top-0 bottom-0 pointer-events-none opacity-30 hidden xl:block w-64">
            <AsciiSphere className="w-full h-full" />
          </div>

          <div className="relative max-w-2xl">
            <h2 className="text-4xl sm:text-5xl font-bold text-background leading-tight">
              Start closing the books{" "}
              <span
                style={{
                  color: "oklch(0.7 0.18 170)",
                }}
              >
                faster, today.
              </span>
            </h2>
            <p className="mt-4 text-lg text-background/70 leading-relaxed">
              Join growing businesses using AM FINTRASS. Free to start, no
              credit card required. Scales with you.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://app.amfintrass.com/signup"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-background text-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Start Free Trial
                <ArrowRight size={14} />
              </a>
              <a
                href="https://cal.com/amfintrass"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-background/30 text-background text-sm font-medium hover:bg-background/10 transition-colors"
              >
                <Calendar size={14} />
                Book a Demo
              </a>
            </div>

            <p className="mt-5 text-xs font-mono text-background/50">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
