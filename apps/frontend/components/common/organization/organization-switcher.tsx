"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { useOrganization, type OrganizationClient } from "@/hooks/use-organization";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Organization } from "@/lib/types/auth";

interface OrganizationSwitcherProps {
  onCreateNew?: () => void;
}

/**
 * Organization Switcher Component
 * Allows users to switch between organizations they're a member of
 */
export function OrganizationSwitcher({
  onCreateNew,
}: OrganizationSwitcherProps) {
  const { activeOrganization, organization } = useOrganization();
  const orgClient: OrganizationClient | null = organization;
  const activeOrg: Organization | null = activeOrganization;
  const [open, setOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);

  if (!organization) {
    return null;
  }

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const result: any = await orgClient?.list?.();
      if (result?.data) {
        setOrganizations(result.data);
      }
    } catch (error) {
      console.error("Failed to load organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrganization = async (org: Organization) => {
    try {
      await orgClient?.setActive?.(org.id);
      setOpen(false);
      // Reload page to reflect new active organization
      window.location.reload();
    } catch (error) {
      console.error("Failed to set active organization:", error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select an organization"
          className="w-[250px] justify-between"
        >
          {activeOrg ? (
            <div className="flex items-center gap-2">
              {activeOrg?.logo && (
                <img
                  src={activeOrg?.logo}
                  alt={activeOrg?.name}
                  className="h-5 w-5 rounded"
                />
              )}
              <span className="truncate">{activeOrg?.name}</span>
            </div>
          ) : (
            "Select organization"
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search organization..." />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading..." : "No organization found."}
            </CommandEmpty>
            <CommandGroup heading="Organizations">
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  onSelect={() => handleSelectOrganization(org)}
                  className="text-sm"
                >
                  <div className="flex items-center gap-2 flex-1">
                    {org.logo && (
                      <img
                        src={org.logo}
                        alt={org.name}
                        className="h-5 w-5 rounded"
                      />
                    )}
                    <span className="truncate">{org.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      activeOrg?.id === org.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreateNew && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      onCreateNew();
                    }}
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Organization
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
