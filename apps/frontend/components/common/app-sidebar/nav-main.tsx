"use client";

import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: string;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  // Check if current path matches any of the item's URLs
  const isItemActive = (item: (typeof items)[0]) => {
    // Check if main URL matches
    if (pathname === item.url) return true;

    // Check if any sub-item URL matches
    return item.items?.some((subItem) => pathname === subItem.url) ?? false;
  };

  // Check if a specific sub-item is active
  const isSubItemActive = (url: string) => {
    return pathname === url;
  };

  // Initialize and update open state based on active items
  useEffect(() => {
    const newOpenItems: Record<string, boolean> = {};
    items.forEach((item) => {
      const isActive = isItemActive(item);
      if (isActive) {
        newOpenItems[item.title] = true;
      } else if (openItems[item.title] === undefined) {
        // Only set default for items not manually toggled
        newOpenItems[item.title] = false;
      } else {
        // Preserve manually toggled state
        newOpenItems[item.title] = openItems[item.title];
      }
    });
    setOpenItems(newOpenItems);
  }, [pathname]);

  const handleOpenChange = (title: string, open: boolean) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: open,
    }));
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const itemActive = isItemActive(item);
          const isOpen = openItems[item.title] ?? itemActive;

          // Items with no sub-items render as a direct link
          if (!item.items || item.items.length === 0) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={itemActive}
                  className={
                    itemActive ? "!bg-[#208049] hover:!bg-[#208049]" : ""
                  }
                >
                  <Link href={item.url}>
                    {item.icon && <span className="text-xs">{item.icon}</span>}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              open={isOpen}
              onOpenChange={(open) => handleOpenChange(item.title, open)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={itemActive}
                    className={
                      itemActive
                        ? "!bg-[#208049] hover:!bg-[#208049] data-[active=true]:!bg-[#208049]/10"
                        : ""
                    }
                  >
                    {item.icon && <span className="text-xs">{item.icon}</span>}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const subItemActive = isSubItemActive(subItem.url);

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={subItemActive}
                            className={
                              subItemActive
                                ? "bg-[#208049]/50! text-white! hover:bg-[#208049]/50! hover:text-white! data-[active=true]:bg-[#208049]! data-[active=true]:text-white!"
                                : ""
                            }
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
