import { Shield, Lock, Eye, FileCheck, Users, BookOpen } from "lucide-react";
import { AsciiTorus } from "../ascii/AsciiTorus";

const securityFeatures = [
  {
    icon: <Lock size={18} />,
    title: "AES-256 Encryption",
    description:
      "All data encrypted at rest and in transit. Military-grade protection.",
  },
  {
    icon: <Shield size={18} />,
    title: "MFA / OTP via Email",
    description:
      "One-time codes on every login for double-layered account protection.",
  },
  {
    icon: <Users size={18} />,
    title: "Role-Based Access Control",
    description:
      "Admins, accountants, viewers — granular permissions for every role.",
  },
  {
    icon: <BookOpen size={18} />,
    title: "Full Audit Logs",
    description:
      "Every change tracked with timestamp, user, and before/after values.",
  },
  {
    icon: <Eye size={18} />,
    title: "GDPR Compliant",
    description: "Your data handling follows international privacy standards.",
  },
  {
    icon: <FileCheck size={18} />,
    title: "Isolated Company Data",
    description:
      "Zero cross-tenant data leakage. Each company is fully isolated.",
  },
];

export function SecuritySection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* AsciiTorus background */}
      <div className="absolute bottom-0 right-0 pointer-events-none opacity-[0.05] w-[500px] h-[500px] overflow-hidden">
        <AsciiTorus className="w-full h-full" />
      </div>
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">
            // DATA SECURITY
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground max-w-2xl">
            Security your{" "}
            <span className="text-primary">accountant will trust.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl leading-relaxed">
            Bank-level security with enterprise-grade compliance. Your financial
            data is protected by industry-leading encryption and strict access
            controls.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {securityFeatures.map((feat) => (
            <div
              key={feat.title}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-all duration-300 card-shadow"
            >
              <div className="w-9 h-9 rounded-lg border border-primary/30 bg-primary/10 flex items-center justify-center text-primary mb-4">
                {feat.icon}
              </div>
              <h3 className="font-semibold text-foreground mb-1.5">
                {feat.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Certifications bar */}
        <div className="border border-border rounded-xl bg-card/50 p-4 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-muted-foreground">
          {[
            "SOC 2 Roadmap",
            "GDPR Compliant",
            "AES-256",
            "Audit Logged",
            "MFA Enforced",
          ].map((tag) => (
            <span key={tag} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
