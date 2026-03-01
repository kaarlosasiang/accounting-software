"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calendar,
  Landmark,
  CalendarRange,
  Hash,
  UserCog,
  CreditCard,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { Resource, Action } from "@sas/validators";

type SettingsNavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
  /** When set, this item is hidden if the user lacks the permission */
  permission?: { resource: Resource; action: Action };
};

type SettingsNavSection = {
  group: string;
  items: SettingsNavItem[];
};

const settingsNavConfig: SettingsNavSection[] = [
  {
    group: "Company",
    items: [
      {
        label: "Company Profile",
        href: "/settings/company",
        icon: Building2,
        description: "Name, logo, address",
        permission: { resource: Resource.companySetting, action: Action.read },
      },
      {
        label: "Accounting Periods",
        href: "/periods",
        icon: Calendar,
        description: "Fiscal cycles & lock dates",
        permission: { resource: Resource.period, action: Action.read },
      },
      {
        label: "Bank Accounts",
        href: "/settings/banking",
        icon: Landmark,
        description: "Connected bank accounts",
        permission: { resource: Resource.companySetting, action: Action.read },
      },
      {
        label: "Fiscal Year",
        href: "/settings/fiscal-year",
        icon: CalendarRange,
        description: "Year-end & tax settings",
        permission: { resource: Resource.companySetting, action: Action.read },
      },
      {
        label: "Numbering Series",
        href: "/settings/numbering",
        icon: Hash,
        description: "Invoice & bill numbering",
        permission: { resource: Resource.companySetting, action: Action.read },
      },
    ],
  },
  {
    group: "Account",
    items: [
      {
        label: "User Preferences",
        href: "/settings/general",
        icon: UserCog,
        description: "Language, timezone, theme",
        // No permission — always visible (personal preference)
      },
      {
        label: "Subscription",
        href: "/settings/billing",
        icon: CreditCard,
        description: "Plan, billing & invoices",
        // No permission — always visible
      },
    ],
  },
  {
    group: "Team",
    items: [
      {
        label: "Team & Roles",
        href: "/settings/team",
        icon: Users,
        description: "Members & permissions",
        permission: { resource: Resource.user, action: Action.read },
      },
    ],
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { can } = usePermissions();

  // Filter sections and items based on the user's effective permissions.
  // `can()` returns true while loading (optimistic), so no flicker on render.
  const settingsNav = settingsNavConfig
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          !item.permission ||
          can(item.permission.resource, item.permission.action),
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="flex min-h-[calc(100vh-6rem)]">
      {/* Settings sidebar */}
      <aside className="w-54 shrink-0 border-r flex flex-col">
        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 pr-6 space-y-4">
          {settingsNav.map((section) => (
            <div key={section.group}>
              <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {section.group}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  // Active if exact match OR starts with href + /
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors group",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive
                            ? "text-primary"
                            : "text-foreground group-hover:text-foreground",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Content area */}
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
