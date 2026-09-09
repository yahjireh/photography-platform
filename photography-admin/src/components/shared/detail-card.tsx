"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { KenteRibbon } from "./kente-ribbon";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface DetailCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  withKente?: boolean;
}

export interface DetailRowProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export interface DetailSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

// ============================================
// DETAIL CARD (Main Container)
// ============================================

export function DetailCard({
  title,
  description,
  icon: Icon,
  children,
  actions,
  className,
  headerClassName,
  bodyClassName,
  withKente = true,
}: DetailCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden relative",
        className
      )}
    >
      {withKente && <KenteRibbon />}
      {/* Card Header */}
      {(title || actions) && (
        <div
          className={cn(
            "px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30",
            headerClassName
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
                {description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      )}

      {/* Card Body */}
      <div className={cn("p-6", bodyClassName)}>{children}</div>
    </motion.div>
  );
}

// ============================================
// DETAIL ROW (Label + Value Pair)
// ============================================

export function DetailRow({ label, value, icon, fullWidth, className }: DetailRowProps) {
  if (fullWidth) {
    return (
      <div className={cn("space-y-2", className)}>
        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </dt>
        <dd className="text-base text-gray-900 dark:text-gray-100">{value || "—"}</dd>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[140px]">
        {label}
      </dt>
      <dd className="text-base text-gray-900 dark:text-gray-100 text-right flex-1">
        {value || "—"}
      </dd>
    </div>
  );
}

// ============================================
// DETAIL GRID (Grid of Detail Rows)
// ============================================

interface DetailGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function DetailGrid({ children, columns = 2, className }: DetailGridProps) {
  return (
    <dl
      className={cn(
        "grid gap-6",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {children}
    </dl>
  );
}

// ============================================
// DETAIL SECTION (Section with Optional Title)
// ============================================

export function DetailSection({ title, children, className }: DetailSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}

// ============================================
// INFO BADGE (Small Pill Badge)
// ============================================

interface InfoBadgeProps {
  label: string;
  value: string | number;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

export function InfoBadge({ label, value, variant = "default", className }: InfoBadgeProps) {
  const variantStyles = {
    default: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
    success: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    warning: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    error: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    info: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  };

  return (
    <div className={cn("inline-flex flex-col gap-1 px-4 py-2 rounded-lg", variantStyles[variant], className)}>
      <span className="text-xs font-medium opacity-75">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}

// ============================================
// STAT BADGE (Compact Stat Display)
// ============================================

interface StatBadgeProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatBadge({ icon: Icon, label, value, trend, className }: StatBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700",
        className
      )}
    >
      {Icon && (
        <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
          <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>
      )}
      <div className="flex-1">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</span>
          {trend && (
            <span
              className={cn(
                "text-xs font-semibold",
                trend.isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE (For Empty Detail Sections)
// ============================================

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {Icon && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
      )}
      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
      {description && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================
// DIVIDER (Section Separator)
// ============================================

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-t border-gray-200 dark:border-gray-800", className)} />;
}
