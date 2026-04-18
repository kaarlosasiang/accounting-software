import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import AuthProvider from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "AM FINTRASS",
  description:
    "Smart accounting built for growing businesses. Import bank statements via CSV, categorize transactions, and get up‑to‑date cash flow and profit insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          src="https://accounts.google.com/gsi/client"
          async
          defer
        ></script>
      </head>
      <body className="antialiased">
        <Analytics />
        <NuqsAdapter>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <QueryProvider>
                {children}
                <Toaster position="top-right" />
              </QueryProvider>
            </AuthProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
