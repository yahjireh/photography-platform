"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Enhanced breadcrumb component for detail pages
 * Shows contextual navigation with actual entity names
 *
 * Usage:
 * <PageBreadcrumb
 *   items={[
 *     { label: "Users", href: "/users" },
 *     { label: "Kwame Mensah" }
 *   ]}
 * />
 */
export function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
  // Always include Dashboard as first item
  const allItems: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/", icon: Home },
    ...items,
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm", className)}
    >
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        const Icon = item.icon;

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
            {isLast ? (
              <span
                className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]"
                title={item.label}
              >
                {Icon && <Icon className="h-4 w-4 inline mr-1" />}
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href || "#"}
                className="font-medium text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center gap-1 truncate max-w-[150px]"
                title={item.label}
              >
                {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                <span className="truncate">{item.label}</span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/**
 * Helper to generate breadcrumb items for common pages
 */
export function getBreadcrumbItems(
  section: string,
  entityName?: string,
  entityId?: string
): BreadcrumbItem[] {
  const sectionMap: Record<string, { label: string; href: string }> = {
    users: { label: "Users", href: "/users" },
    photographers: { label: "Photographers", href: "/photographers" },
    bookings: { label: "Bookings", href: "/bookings" },
    payments: { label: "Payments", href: "/payments" },
    reviews: { label: "Reviews", href: "/reviews" },
    disputes: { label: "Disputes", href: "/disputes" },
    analytics: { label: "Analytics", href: "/analytics" },
    settings: { label: "Settings", href: "/settings" },
    notifications: { label: "Notifications", href: "/notifications" },
  };

  const sectionInfo = sectionMap[section] || {
    label: section.charAt(0).toUpperCase() + section.slice(1),
    href: `/${section}`,
  };

  const items: BreadcrumbItem[] = [sectionInfo];

  if (entityName) {
    items.push({ label: entityName });
  } else if (entityId) {
    // Fallback to shortened ID if no name provided
    items.push({ label: `#${entityId.slice(0, 8)}...` });
  }

  return items;
}

/**
 * Back button component for detail pages
 */
interface BackButtonProps {
  href: string;
  label?: string;
  className?: string;
}

export function BackButton({ href, label = "Back", className }: BackButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-medium text-sm",
        className
      )}
    >
      <ChevronRight className="h-4 w-4 rotate-180" />
      {label}
    </Link>
  );
}
