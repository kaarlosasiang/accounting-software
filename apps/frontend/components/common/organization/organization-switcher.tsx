"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  useActiveOrganization,
  useListOrganizations,
  authClient,
} from "@/lib/config/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Organization } from "@/lib/types/auth";

interface OrganizationSwitcherProps {
  onCreateNew?: () => void;
}

export function OrganizationSwitcher({
  onCreateNew,
}: OrganizationSwitcherProps) {
  const { isMobile } = useSidebar();
  const { data: activeOrg } = useActiveOrganization() as {
    data: Organization | null;
  };
  const { data: orgsData } = useListOrganizations();
  const organizations = (orgsData as Organization[] | null | undefined) ?? [];

  const handleSelect = async (org: Organization) => {
    if (org.id === activeOrg?.id) return;
    await (authClient as any).organization.setActive({
      organizationId: org.id,
    });
    window.location.reload();
  };

  if (!activeOrg) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-semibold shrink-0">
                {activeOrg.logo ? (
                  <img
                    src={activeOrg.logo}
                    alt={activeOrg.name}
                    className="size-full rounded-lg object-cover"
                  />
                ) : (
                  activeOrg.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeOrg.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {activeOrg.slug}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {organizations.map((org, index) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSelect(org)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border text-xs font-semibold shrink-0">
                  {org.logo ? (
                    <img
                      src={org.logo}
                      alt={org.name}
                      className="size-full rounded-md object-cover"
                    />
                  ) : (
                    org.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="flex-1 truncate">{org.name}</span>
                {org.id === activeOrg.id && (
                  <Check className="size-4 shrink-0" />
                )}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            {onCreateNew && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onCreateNew} className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Plus className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">
                    New Organization
                  </div>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
