import { Twitter, Linkedin, Github } from "lucide-react";

const links = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "/changelog" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/docs/api" },
    { label: "FAQ", href: "#faq" },
    { label: "Blog", href: "/blog" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
    { label: "Status", href: "https://status.amfintrass.com" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
};

export function FooterSection() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center mb-4">
              <img
                src="/am-fintrass-logo.png"
                alt="AM FINTRASS"
                className="h-12 w-auto dark:hidden"
              />
              <img
                src="/am-fintrass-logo-light.png"
                alt="AM FINTRASS"
                className="h-12 w-auto hidden dark:block"
              />
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Smart accounting for growing businesses. Close your books faster.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href="https://twitter.com/amfintrass"
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={16} />
              </a>
              <a
                href="https://linkedin.com/company/amfintrass"
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={16} />
              </a>
              <a
                href="https://github.com/amfintrass"
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="GitHub"
              >
                <Github size={16} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([col, items]) => (
            <div key={col}>
              <h4 className="text-xs font-mono font-medium text-foreground tracking-widest uppercase mb-4">
                {col}
              </h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-mono text-muted-foreground">
            © {year} AM FINTRASS. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
